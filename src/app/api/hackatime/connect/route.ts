import { createHash, randomBytes } from "node:crypto";

import { NextResponse, type NextRequest } from "next/server";

import { env } from "~/env";
import { auth } from "~/server/auth";
import { rateLimit } from "~/server/rate-limit";
import {
  HACKATIME,
  hackatimeConfigured,
  redirectUri,
} from "~/server/hackatime";

const b64url = (buf: Buffer) => buf.toString("base64url");

function safeNext(p: string | null) {
  return p?.startsWith("/platform") ? p : "/platform/profile";
}

/** Start linking Hackatime to the signed-in Scare account. */
export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const back = (status: string) => {
    const url = new URL(next, req.nextUrl.origin);
    url.searchParams.set("hackatime", status);
    return NextResponse.redirect(url);
  };

  const session = await auth();
  if (!session) {
    return NextResponse.redirect(
      new URL(
        `/login?callbackUrl=${encodeURIComponent(next)}`,
        req.nextUrl.origin,
      ),
    );
  }
  if (!hackatimeConfigured) return back("unconfigured");
  if (!rateLimit(`hackatime-connect:${session.user.id}`, 10, 60_000).ok) return back("failed");

  const state = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());

  const authorize = new URL(HACKATIME.authorize);
  authorize.search = new URLSearchParams({
    client_id: env.HACKATIME_CLIENT_ID!,
    redirect_uri: redirectUri(req.nextUrl.origin),
    response_type: "code",
    scope: HACKATIME.scope,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  const res = NextResponse.redirect(authorize);
  res.cookies.set(
    HACKATIME.cookie,
    JSON.stringify({ state, verifier, next, userId: session.user.id }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: HACKATIME.callbackPath,
      maxAge: 600,
    },
  );
  return res;
}
