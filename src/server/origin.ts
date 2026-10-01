import "server-only";

import { type NextRequest } from "next/server";

import { env } from "~/env";

/**
 * The site's public origin, for redirects we build ourselves. Behind the production proxy,
 * `req.nextUrl.origin` is the container's own address (https://localhost:3000), so prefer
 * AUTH_URL, then the forwarded host the proxy saw, and only then the request URL.
 */
export function publicOrigin(req: NextRequest) {
  return originFromHeaders(req.headers, req.nextUrl.origin);
}

/** Same, from bare headers (tRPC context, server actions). */
export function originFromHeaders(headers: Headers, fallback = "http://localhost:3000") {
  if (env.AUTH_URL) return new URL(env.AUTH_URL).origin;
  const host = headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? headers.get("host");
  if (!host) return fallback;
  const proto =
    headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
