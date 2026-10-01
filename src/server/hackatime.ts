import "server-only";

import { env } from "~/env";
import { decrypt } from "~/server/crypto";
import { db } from "~/server/db";

/**
 * Hackatime (https://hackatime.hackclub.com), OAuth 2.0 authorization code + PKCE.
 * Linked to an existing Scare account; it is never a way to sign in.
 */
export const HACKATIME = {
  authorize: "https://hackatime.hackclub.com/oauth/authorize",
  token: "https://hackatime.hackclub.com/oauth/token",
  revoke: "https://hackatime.hackclub.com/oauth/revoke",
  api: "https://hackatime.hackclub.com/api/v1/authenticated",
  settings:
    "https://hackatime.hackclub.com/my/settings/privacy#authorized_applications",
  scope: "profile read",
  callbackPath: "/api/auth/callback/hackatime",
  cookie: "scare_hackatime_oauth",
} as const;

export const hackatimeConfigured = Boolean(
  env.HACKATIME_CLIENT_ID && env.HACKATIME_CLIENT_SECRET,
);

export function redirectUri(origin: string) {
  return new URL(HACKATIME.callbackPath, env.AUTH_URL ?? origin).toString();
}

export interface HackatimeMe {
  id: number;
  emails?: string[];
  slack_id?: string | null;
  github_username?: string | null;
  trust_factor?: { trust_level?: string; trust_value?: number };
}

export interface HackatimeProject {
  name: string;
  total_seconds: number;
  most_recent_heartbeat: string | null;
  languages: string[];
  archived: boolean;
}

export class HackatimeError extends Error {
  constructor(
    public reason: "not-linked" | "revoked" | "unavailable",
    message = reason,
  ) {
    super(message);
  }
}

async function call<T>(token: string, path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${HACKATIME.api}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new HackatimeError("unavailable");
  }
  if (res.status === 401 || res.status === 403)
    throw new HackatimeError("revoked");
  if (!res.ok) throw new HackatimeError("unavailable");
  return (await res.json()) as T;
}

export const fetchMe = (token: string) => call<HackatimeMe>(token, "/me");

/** Exchange an authorization code for a token (form-encoded, per the Hackatime docs). */
export async function exchangeCode(
  code: string,
  verifier: string,
  redirect: string,
) {
  const res = await fetch(HACKATIME.token, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: env.HACKATIME_CLIENT_ID ?? "",
      client_secret: env.HACKATIME_CLIENT_SECRET ?? "",
      code,
      redirect_uri: redirect,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as { access_token: string; scope?: string };
}

async function tokenFor(userId: string) {
  const link = await db.hackatimeLink.findUnique({ where: { userId } });
  if (!link) throw new HackatimeError("not-linked");
  return decrypt(link.accessToken);
}

/** The user's Hackatime projects, most recently worked on first. */
export async function listProjects(userId: string) {
  const token = await tokenFor(userId);
  const { projects } = await call<{ projects: HackatimeProject[] }>(
    token,
    "/projects",
  );
  return projects
    .filter((p) => !p.archived)
    .sort(
      (a, b) =>
        (b.most_recent_heartbeat ? Date.parse(b.most_recent_heartbeat) : 0) -
        (a.most_recent_heartbeat ? Date.parse(a.most_recent_heartbeat) : 0),
    );
}

/** Seconds tracked on one project, or null if the user has no project by that name. */
export async function projectSeconds(userId: string, name: string) {
  const projects = await listProjects(userId);
  return projects.find((p) => p.name === name)?.total_seconds ?? null;
}

/** Revoke our token on Hackatime's side (best effort) and forget the link. */
export async function unlink(userId: string) {
  const link = await db.hackatimeLink.findUnique({ where: { userId } });
  if (!link) return;
  await fetch(HACKATIME.revoke, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token: decrypt(link.accessToken),
      client_id: env.HACKATIME_CLIENT_ID ?? "",
      client_secret: env.HACKATIME_CLIENT_SECRET ?? "",
    }),
    cache: "no-store",
  }).catch(() => undefined);
  await db.hackatimeLink.delete({ where: { userId } });
}
