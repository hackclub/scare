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
  technicalFeatures: "fldKmk82PssX4ZUhb", // Justification - Specific Technical Features
  deflation: "fld26wxZGOAhJS4tA", // Justification - Deflation Justification
  lapseLinks: "fldhDbksFHBOWWhXk", // Justification - Lapse Links, comma-separated
  alternateTracking: "fldW3FuQSGPIpznJ8", // Justification - Alternate Tracking Method
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

export function signedScreenshotUrl(origin: string, gameId: string, ttlMs = SIGNED_TTL_MS) {
  const exp = Date.now() + ttlMs;
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

type Status = "Pending" | "Accepted" | "Resubmission Requested" | "Rejected";

/** The parts of an Ari review Scare keeps (Game.reviewDetail). */
export interface ReviewDetail {
  decision: "approved" | "changes" | "rejected";
  reviewer: string | null;
  note: string;
  justification: {
    hackatime_projects?: string;
    hackatime_user_id?: string;
    lapse_links?: string;
    technical_features?: string;
    deflation_reason?: string;
    time_evidence?: string;
    supporting_evidence?: string;
    hours_reasoning?: string;
    additional_justification?: string;
  };
}
const joined = (...parts: (string | null | undefined)[]) => parts.filter((p) => p?.trim()).join("\n\n") || null;

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
    const estimated = edited ? claimed : tracked;
    const review = game.reviewDetail as ReviewDetail | null;
    const j = review?.justification ?? {};

    // The reviewer's approval note feeds the Unified Justification. That formula uses only the
    // override justification when hours were overridden, so the note goes there too in that case.
    const reviewerNote =
      game.reviewStatus === "APPROVED" && game.reviewNote
        ? `Reviewed in ${review ? "Ari" : "Scare"} by ${review?.reviewer ?? game.reviewedBy ?? "an admin"}: ${game.reviewNote}`
        : null;
    const additional = joined(j.additional_justification, reviewerNote);
    // Ari's approved hours win over the participant's figure when they differ.
    const approved = game.reviewStatus === "APPROVED" ? game.reviewHours : null;
    const override = approved != null && approved !== estimated ? approved : edited ? claimed : null;
    // The Unified Justification formula reads only this field once hours are overridden, so it
    // carries the reasoning and everything else the reviewer wrote.
    const overrideJustification =
      override == null
        ? null
        : joined(
            edited ? `The participant changed their hours in Scare from Hackatime's ${tracked ?? 0}h to ${claimed}h.` : null,
            approved != null && approved !== estimated ? `Ari's reviewer approved ${approved}h.` : null,
            j.hours_reasoning,
            j.deflation_reason,
            additional,
          );

    const fields: Record<string, unknown> = {
      [F.codeUrl]: game.sourceUrl,
      [F.playableUrl]: game.playUrl,
      [F.description]: game.pitch,
      [F.screenshot]: game.screenshot
        ? [{ url: signedScreenshotUrl(origin, game.id), filename: `${game.id}.png` }]
        : [],
      [F.githubUsername]: game.user.hackatime?.githubUsername ?? null,
      [F.hackatimeId]: j.hackatime_user_id ?? (game.user.hackatime ? String(game.user.hackatime.hackatimeId) : null),
      [F.hackatimeProjects]:
        j.hackatime_projects ??
        (game.hackatimeProject
          ? `${game.hackatimeProject} (all Hackatime time up to ${day(game.shippedAt) ?? "shipping"})`
          : null),
      [F.estimatedHours]: estimated,
      [F.overrideHours]: override,
      [F.overrideJustification]: overrideJustification,
      [F.additionalJustification]: additional,
      [F.technicalFeatures]: j.technical_features ?? null,
      [F.deflation]: j.deflation_reason ?? null,
      [F.lapseLinks]: j.lapse_links ?? null,
      [F.alternateTracking]: joined(j.time_evidence, j.supporting_evidence),
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
  review: { status: "Accepted" | "Pending" } | { status: "Resubmission Requested" | "Rejected"; reason: string },
) {
  if (!airtableConfigured) return;
  // Every decision rewrites the whole record, so hours and justification follow the review.
  await syncShip(gameId, origin, review.status);
  const game = await db.game.findUnique({ where: { id: gameId }, select: { airtableRecordId: true } });
  if (!game?.airtableRecordId) return;
  try {
    await airtable(
      "PATCH",
      { [F.resubmitReason]: "reason" in review ? review.reason.slice(0, 500) : null },
      game.airtableRecordId,
    );
  } catch (e) {
    await record(gameId, e instanceof Error ? e.message.slice(0, 500) : "Airtable sync failed.").catch(() => undefined);
  }
}
