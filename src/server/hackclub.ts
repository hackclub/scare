import "server-only";

import { env } from "~/env";
import { decrypt, encrypt } from "~/server/crypto";
import { db } from "~/server/db";

/**
 * Hack Club Auth (https://auth.hackclub.com), OAuth 2.0.
 * Guide: https://auth.hackclub.com/docs/oauth-guide · API: https://auth.hackclub.com/docs/api
 */
export const HACKCLUB_AUTH = {
  authorize: "https://auth.hackclub.com/oauth/authorize",
  token: "https://auth.hackclub.com/oauth/token",
  me: "https://auth.hackclub.com/api/v1/me",
  verify: "https://auth.hackclub.com",
} as const;

/**
 * phone, birthdate, basic_info and address are HQ-only scopes; they need the app
 * to be at the hq_official trust level.
 */
export const HACKCLUB_SCOPES = [
  "email",
  "name",
  "phone",
  "birthdate",
  "address",
  "verification_status",
  "slack_id",
  "basic_info",
].join(" ");

export type VerificationStatus =
  | "needs_submission"
  | "pending"
  | "verified"
  | "ineligible";

export interface HackClubAddress {
  id: string;
  first_name?: string;
  last_name?: string;
  line_1?: string;
  line_2?: string | null;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone_number?: string;
  primary?: boolean;
}

/** GET /api/v1/me. Fields appear only for the scopes granted. */
export interface HackClubMe {
  identity: {
    id: string;
    ysws_eligible?: boolean;
    verification_status?: VerificationStatus;
    first_name?: string;
    last_name?: string;
    primary_email?: string;
    slack_id?: string;
    phone_number?: string;
    birthday?: string;
    legal_first_name?: string;
    legal_last_name?: string;
    addresses?: HackClubAddress[];
  };
  scopes: string[];
}

export function displayName(i: HackClubMe["identity"]) {
  return [i.first_name, i.last_name].filter(Boolean).join(" ") || null;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/**
 * Refresh tokens rotate: every refresh returns a new one and the old one dies,
 * so the newest pair is written back immediately.
 */
async function refresh(accountId: string, refreshToken: string) {
  const res = await fetch(HACKCLUB_AUTH.token, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: env.AUTH_HACKCLUB_ID,
      client_secret: env.AUTH_HACKCLUB_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const t = (await res.json()) as TokenResponse;
  await db.account.update({
    where: { id: accountId },
    data: {
      access_token: encrypt(t.access_token),
      refresh_token: encrypt(t.refresh_token ?? refreshToken),
      expires_at: Math.floor(Date.now() / 1000) + t.expires_in,
      scope: t.scope,
    },
  });
  return t.access_token;
}

export type IdentityResult =
  | { ok: true; me: HackClubMe }
  | { ok: false; reason: "no-account" | "expired" | "unavailable" };

/** Read a user's identity live from Hack Club Auth, refreshing the access token if it's stale. */
export async function getIdentity(userId: string): Promise<IdentityResult> {
  const account = await db.account.findFirst({
    where: { userId, provider: "hackclub" },
  });
  if (!account?.access_token) return { ok: false, reason: "no-account" };

  let token: string | null = decrypt(account.access_token);
  const expiresSoon =
    account.expires_at !== null && account.expires_at * 1000 < Date.now() + 60_000;
  if (expiresSoon) {
    token = account.refresh_token ? await refresh(account.id, decrypt(account.refresh_token)) : null;
    if (!token) return { ok: false, reason: "expired" };
  }

  try {
    const res = await fetch(HACKCLUB_AUTH.me, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 401) return { ok: false, reason: "expired" };
    if (!res.ok) return { ok: false, reason: "unavailable" };
    return { ok: true, me: (await res.json()) as HackClubMe };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/** The fields Scare keeps: enough to show status and gate rewards, nothing sensitive. */
export function storedFields(me: HackClubMe) {
  const i = me.identity;
  return {
    hcIdentityId: i.id,
    name: displayName(i) ?? undefined,
    email: i.primary_email ?? undefined,
    slackId: i.slack_id ?? null,
    yswsEligible: i.ysws_eligible ?? false,
    verificationStatus: i.verification_status ?? null,
  };
}
