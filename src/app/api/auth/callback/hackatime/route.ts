import { NextResponse, type NextRequest } from "next/server";

import { auth } from "~/server/auth";
import { encrypt } from "~/server/crypto";
import { db } from "~/server/db";
import { rateLimit } from "~/server/rate-limit";
import {
  HACKATIME,
  HackatimeError,
  exchangeCode,
  fetchMe,
  redirectUri,
} from "~/server/hackatime";

interface Pending {
  state: string;
  verifier: string;
  next: string;
  userId: string;
}

/**
 * Hackatime's OAuth callback. This static route takes precedence over Auth.js's
 * catch-all, so Hackatime only ever links to an existing Scare account.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  let pending: Pending | null = null;
  try {
    pending = JSON.parse(
      req.cookies.get(HACKATIME.cookie)?.value ?? "null",
    ) as Pending | null;
  } catch {
    pending = null;
  }

  const finish = (status: string) => {
    // The cookie is client-held, so re-check it before redirecting anywhere.
    const next = pending?.next?.startsWith("/platform/")
      ? pending.next
      : "/platform/profile";
    const url = new URL(
      next,
      req.nextUrl.origin,
    );
    url.searchParams.set("hackatime", status);
    const res = NextResponse.redirect(url);
    res.cookies.delete({
      name: HACKATIME.cookie,
      path: HACKATIME.callbackPath,
    });
    return res;
  };

  const session = await auth();
  if (!session)
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  if (!rateLimit(`hackatime-cb:${session.user.id}`, 10, 60_000).ok) return finish("failed");

  if (params.get("error")) return finish("denied");
  const code = params.get("code");
  if (
    !pending ||
    !code ||
    params.get("state") !== pending.state ||
    pending.userId !== session.user.id
  ) {
    return finish("expired");
  }

  const token = await exchangeCode(
    code,
    pending.verifier,
    redirectUri(req.nextUrl.origin),
  );
  if (!token) return finish("failed");

  let me;
  try {
    me = await fetchMe(token.access_token);
  } catch (e) {
    return finish(
      e instanceof HackatimeError && e.reason === "revoked"
        ? "failed"
        : "unavailable",
    );
  }

  // One Hackatime account belongs to one Scare account.
  const owner = await db.hackatimeLink.findUnique({
    where: { hackatimeId: me.id },
  });
  if (owner && owner.userId !== session.user.id) return finish("taken");

  const data = {
    hackatimeId: me.id,
    accessToken: encrypt(token.access_token),
    scope: token.scope ?? null,
    slackId: me.slack_id ?? null,
    githubUsername: me.github_username ?? null,
    trustLevel: me.trust_factor?.trust_level ?? null,
  };
  try {
    await db.hackatimeLink.upsert({
      where: { userId: session.user.id },
      create: { ...data, userId: session.user.id },
      update: data,
    });
  } catch (e) {
    // Lost a race for the same Hackatime account (unique hackatimeId).
    if ((e as { code?: string }).code === "P2002") return finish("taken");
    throw e;
  }

  return finish("linked");
}
