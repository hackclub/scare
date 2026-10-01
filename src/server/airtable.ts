import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "~/env";
import { db } from "~/server/db";
import { getIdentity } from "~/server/hackclub";

/**
 * Shipped projects are mirrored to the program's Airtable base ("YSWS Project Submission"),
 * which is how they reach Hack Club's Unified YSWS database. Scare creates the record when a
 * game ships and keeps its Status in step with the admin review. Scare never ticks
 * "Automation - Submit to Unified YSWS"; a person does that in Airtable.
 *
 * Fields are written by ID so renaming a column in Airtable doesn't break the sync.
 */
const F = {
  codeUrl: "fld4IxGdJU7rzov0i", // Code URL
  playableUrl: "fldeVK3m3Bc0BJh0M", // Playable URL
  firstName: "fld4VdYYOprfpzIsF", // First Name
  lastName: "fldoiW90VtyFVv7YC", // Last Name
  email: "fld7uOC5u9cSsRSak", // Email
  screenshot: "fld4NiPFcbsww6pAx", // Screenshot
  description: "fldUCgwClUA3FalLy", // Description
  githubUsername: "fldAYFbf5UpMv9UrS", // GitHub Username
  address1: "fldHGYnwyFcRAgUT0", // Address (Line 1)
  address2: "fldlIz5PUDzjsp24U", // Address (Line 2)
  city: "fldPQxXFKR8RE2onA", // City
  state: "flddQkcBqUdA70NrX", // State / Province
  country: "fld5mMLLdJraHJqe4", // Country
  zip: "fldpMXHtEnDaYgETm", // ZIP / Postal Code
  birthday: "fldlM9M9Xr6sHZGVW", // Birthday
  estimatedHours: "fldaGtaDwRovTlSWD", // Estimated Hours Spent
  overrideHours: "fld647hJLNbOrRdQv", // Optional - Override Hours Spent
  overrideJustification: "fldmopdX3c5BmEMz5", // Optional - Override Hours Spent Justification
  hackatimeId: "fldV1Zlps7yM5idq2", // Justification - Submitter Hackatime ID
  hackatimeProjects: "fldaRPvTChHhR6MhS", // Justification - Hackatime Project Name(s) + Date Range(s)
  additionalJustification: "fldpDfgEAo5eWW5ZA", // Justification - Additional Justification
  status: "fldfpZrihjUEwPUMk", // Status
  resubmitReason: "fldjtQStpQfx4AuM5", // Resubmission Request Reason
} as const;

export const airtableConfigured = Boolean(env.AIRTABLE_PAT && env.AIRTABLE_BASE_ID && env.AIRTABLE_TABLE_ID);

const endpoint = (recordId?: string) =>
  `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_ID}${recordId ? `/${recordId}` : ""}`;

async function airtable(method: "POST" | "PATCH", fields: Record<string, unknown>, recordId?: string) {
  const res = await fetch(endpoint(recordId), {
    method,
    headers: { Authorization: `Bearer ${env.AIRTABLE_PAT}`, "Content-Type": "application/json" },
    // typecast lets single-select values like "Pending" match by name.
    body: JSON.stringify({ fields, typecast: true }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string; type?: string } };
  if (!res.ok || !json.id) {
    throw new Error(`Airtable ${res.status}: ${json.error?.message ?? json.error?.type ?? "request failed"}`);
  }
  return json.id;
}

/**
 * An existing record for this code URL, if Scare made one but never got to save its ID
 * (a crash between Airtable's reply and our write). Re-using it keeps a retry from duplicating.
 */
async function findByCodeUrl(codeUrl: string | null) {
  if (!codeUrl) return null;
  const url = new URL(endpoint());
  url.searchParams.set("filterByFormula", `{${F.codeUrl}} = '${codeUrl.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`);
  url.searchParams.set("maxRecords", "1");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${env.AIRTABLE_PAT}` }, cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { records?: { id: string }[] };
  const id = json.records?.[0]?.id;
  if (!id) return null;
  // Only adopt it if no other game already owns that record.
  const owner = await db.game.findFirst({ where: { airtableRecordId: id }, select: { id: true } });
  return owner ? null : id;
}

/* ------------------------------------------------------------ screenshot links */

/**
 * Airtable copies attachments from a URL it can fetch, but screenshots are private. So the
 * record carries a signed link that works without a session for a limited time.
 */
const SIGNED_TTL_MS = 3 * 24 * 60 * 60 * 1000;

function signature(gameId: string, exp: number) {
  return createHmac("sha256", env.AUTH_SECRET ?? "scare-dev-secret").update(`screenshot:${gameId}:${exp}`).digest("base64url");
}

export function signedScreenshotUrl(origin: string, gameId: string) {
  const exp = Date.now() + SIGNED_TTL_MS;
  const url = new URL(`/api/games/${gameId}/screenshot`, origin);
  url.searchParams.set("exp", String(exp));
  url.searchParams.set("sig", signature(gameId, exp));
  return url.toString();
}

export function verifyScreenshotSignature(gameId: string, exp: string | null, sig: string | null) {
  const n = Number(exp);
  if (!sig || !Number.isFinite(n) || n < Date.now()) return false;
  const want = Buffer.from(signature(gameId, n));
  const got = Buffer.from(sig);
  return want.length === got.length && timingSafeEqual(want, got);
}

/* ------------------------------------------------------------ sync */

const hours = (seconds: number | null | undefined) =>
  seconds === null || seconds === undefined ? null : Math.round((seconds / 3600) * 100) / 100;

const day = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);

type Status = "Pending" | "Accepted" | "Resubmission Requested";

async function record(gameId: string, error: string | null, recordId?: string) {
  await db.game.update({
    where: { id: gameId },
    data: {
      ...(recordId ? { airtableRecordId: recordId } : {}),
      airtableSyncedAt: error ? undefined : new Date(),
      airtableError: error,
    },
  });
}

/**
 * Create or update a game's Airtable record with everything Scare knows: the project, the
 * person (read live from Hack Club Auth, never stored in Scare), and Hackatime time.
 * Never throws: failures are saved on the game so an admin can see them and retry.
 */
export async function syncShip(gameId: string, origin: string, status: Status = "Pending") {
  if (!airtableConfigured) return;
  try {
    const game = await db.game.findUniqueOrThrow({
      where: { id: gameId },
      include: {
        screenshot: { select: { id: true } },
        user: { select: { id: true, hackatime: { select: { hackatimeId: true, githubUsername: true } } } },
      },
    });

    const id = await getIdentity(game.user.id);
    const person = id.ok ? id.me.identity : null;
    const address = person?.addresses?.find((a) => a.primary) ?? person?.addresses?.[0];

    const tracked = hours(game.trackedSeconds);
    const claimed = hours(game.claimedSeconds);
    const edited = claimed !== null && claimed !== tracked;

    // The reviewer's approval note feeds the Unified Justification. That formula uses only the
    // override justification when hours were overridden, so the note goes there too in that case.
    const reviewerNote =
      game.reviewStatus === "APPROVED" && game.reviewNote
        ? `Reviewed in Scare by ${game.reviewedBy ?? "an admin"}: ${game.reviewNote}`
        : null;
    const overrideJustification = edited
      ? [
          `The participant changed their hours in Scare from Hackatime's ${tracked ?? 0}h to ${claimed}h.`,
          reviewerNote,
        ]
          .filter(Boolean)
          .join("\n\n")
      : null;

    const fields: Record<string, unknown> = {
      [F.codeUrl]: game.sourceUrl,
      [F.playableUrl]: game.playUrl,
      [F.description]: game.pitch,
      [F.screenshot]: game.screenshot
        ? [{ url: signedScreenshotUrl(origin, game.id), filename: `${game.id}.png` }]
        : [],
      [F.githubUsername]: game.user.hackatime?.githubUsername ?? null,
      [F.hackatimeId]: game.user.hackatime ? String(game.user.hackatime.hackatimeId) : null,
      [F.hackatimeProjects]: game.hackatimeProject
        ? `${game.hackatimeProject} (all Hackatime time up to ${day(game.shippedAt) ?? "shipping"})`
        : null,
      [F.estimatedHours]: edited ? claimed : tracked,
      [F.overrideHours]: edited ? claimed : null,
      [F.overrideJustification]: overrideJustification,
      [F.additionalJustification]: reviewerNote,
      [F.status]: status,
    };
    if (person) {
      Object.assign(fields, {
        [F.firstName]: person.first_name ?? null,
        [F.lastName]: person.last_name ?? null,
        [F.email]: person.primary_email ?? null,
        [F.birthday]: person.birthday ?? null,
        [F.address1]: address?.line_1 ?? null,
        [F.address2]: address?.line_2 ?? null,
        [F.city]: address?.city ?? null,
        [F.state]: address?.state ?? null,
        [F.country]: address?.country ?? null,
        [F.zip]: address?.postal_code ?? null,
      });
    }

    const existing = game.airtableRecordId ?? (await findByCodeUrl(game.sourceUrl));
    const recordId = await airtable(existing ? "PATCH" : "POST", fields, existing ?? undefined);
    await record(
      game.id,
      person ? null : "Couldn't read their Hack Club identity, so name, email, birthday and address are missing. Ask them to sign in again, then retry.",
      recordId,
    );
  } catch (e) {
    await record(gameId, e instanceof Error ? e.message.slice(0, 500) : "Airtable sync failed.").catch(() => undefined);
  }
}

/** Push an admin review result to the record (creating it first if the ship never synced). */
export async function syncReview(
  gameId: string,
  origin: string,
  review: { status: "Accepted" } | { status: "Resubmission Requested"; reason: string },
) {
  if (!airtableConfigured) return;
  const game = await db.game.findUnique({ where: { id: gameId }, select: { airtableRecordId: true } });
  // Approval rewrites the whole record, so the reviewer's note reaches the justification fields.
  if (!game?.airtableRecordId || review.status === "Accepted") return syncShip(gameId, origin, review.status);
  try {
    await airtable(
      "PATCH",
      {
        [F.status]: review.status,
        [F.resubmitReason]: review.status === "Resubmission Requested" ? review.reason.slice(0, 500) : null,
      },
      game.airtableRecordId,
    );
    await record(gameId, null);
  } catch (e) {
    await record(gameId, e instanceof Error ? e.message.slice(0, 500) : "Airtable sync failed.").catch(() => undefined);
  }
}
