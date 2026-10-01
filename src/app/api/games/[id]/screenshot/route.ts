import { NextResponse, type NextRequest } from "next/server";

import { SCREENSHOT_MAX_BYTES, sniffScreenshot } from "~/lib/screenshot";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { rateLimit } from "~/server/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

const error = (message: string, status: number) => NextResponse.json({ error: message }, { status });

async function ownedGame(userId: string, id: string) {
  return db.game.findFirst({ where: { id, userId }, select: { id: true } });
}

/** Upload (or replace) a game's screenshot. Multipart form, field "file". */
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return error("Sign in first.", 401);
  const { id } = await params;
  if (!(await ownedGame(session.user.id, id))) return error("That game isn't yours.", 404);

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

/** The image itself, for its owner. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return error("Sign in first.", 401);
  const { id } = await params;
  const shot = await db.screenshot.findFirst({
    where: { gameId: id, game: { userId: session.user.id } },
    select: { mime: true, data: true },
  });
  if (!shot) return error("No screenshot.", 404);
  return new Response(new Uint8Array(shot.data), {
    headers: {
      "Content-Type": shot.mime,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
