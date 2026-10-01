import { NextResponse, type NextRequest } from "next/server";

import { SCREENSHOT_MAX_BYTES, sniffScreenshot } from "~/lib/screenshot";
import { getAdmin } from "~/server/admin";
import { verifyScreenshotSignature } from "~/server/airtable";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { rateLimit } from "~/server/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

const error = (message: string, status: number) => NextResponse.json({ error: message }, { status });

async function ownedGame(userId: string, id: string) {
  return db.game.findFirst({ where: { id, userId }, select: { status: true } });
}

/** Upload (or replace) a game's screenshot. Multipart form, field "file". */
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return error("Sign in first.", 401);
  const { id } = await params;
  const game = await ownedGame(session.user.id, id);
  if (!game) return error("That game isn't yours.", 404);
  // Shipped games are locked, screenshot included.
  if (game.status !== "BREWING") return error("Shipped projects can't be edited.", 403);

  if (!rateLimit(`screenshot:${session.user.id}`, 20, 10 * 60_000).ok) {
    return error("Too many uploads. Wait a few minutes and try again.", 429);
  }
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > SCREENSHOT_MAX_BYTES + 64 * 1024) return error("Screenshots can be up to 5 MB.", 413);

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return error("That upload didn't come through. Try again.", 400);
  }
  if (!(file instanceof File)) return error("Choose an image to upload.", 400);
  if (file.size > SCREENSHOT_MAX_BYTES) return error("Screenshots can be up to 5 MB.", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffScreenshot(bytes);
  if (!kind.ok) return error(kind.message, 415);

  const shot = await db.screenshot.upsert({
    where: { gameId: id },
    create: { gameId: id, mime: kind.mime, size: bytes.length, data: bytes },
    update: { mime: kind.mime, size: bytes.length, data: bytes },
    select: { updatedAt: true, size: true },
  });
  return NextResponse.json({ ok: true, ...shot });
}

/** The image itself: for its owner, an admin, or a signed, expiring link (how Airtable fetches it). */
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const sp = req.nextUrl.searchParams;
  if (verifyScreenshotSignature(id, sp.get("exp"), sp.get("sig"))) {
    const shot = await db.screenshot.findUnique({ where: { gameId: id }, select: { mime: true, data: true } });
    if (!shot) return error("No screenshot.", 404);
    return new Response(new Uint8Array(shot.data), {
      headers: {
        "Content-Type": shot.mime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  }

  const session = await auth();
  if (!session) return error("Sign in first.", 401);
  // The owner, or an admin reviewing the ship.
  const admin = await getAdmin();
  const shot = await db.screenshot.findFirst({
    where: admin ? { gameId: id } : { gameId: id, game: { userId: session.user.id } },
    select: { mime: true, data: true },
  });
  if (!shot) return error("No screenshot.", 404);
  return new Response(new Uint8Array(shot.data), {
    headers: {
      "Content-Type": shot.mime,
      // The URL carries ?v=<updatedAt>, so a replaced screenshot gets a new URL.
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
