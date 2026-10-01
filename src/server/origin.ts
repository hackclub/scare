import "server-only";

import { type NextRequest } from "next/server";

import { env } from "~/env";

/**
 * The site's public origin, for redirects we build ourselves. Behind the production proxy,
 * `req.nextUrl.origin` is the container's own address (https://localhost:3000), so prefer
 * AUTH_URL, then the forwarded host the proxy saw, and only then the request URL.
 */
export function publicOrigin(req: NextRequest) {
  if (env.AUTH_URL) return new URL(env.AUTH_URL).origin;
  const host = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (host) {
    const proto =
      req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
      req.nextUrl.protocol.replace(":", "");
    return `${proto}://${host}`;
  }
  return req.nextUrl.origin;
}
