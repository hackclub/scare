import "server-only";

import { Ari, AriApiError, AriInputError, type AriWebhookEvent } from "@hackclub/ari";

import { env } from "~/env";
import { Prisma } from "../../generated/prisma";
import { PUMPKINS_PER_HOUR } from "~/lib/program";
import { syncReview, signedScreenshotUrl, syncShip, type ReviewDetail } from "~/server/airtable";
import { db } from "~/server/db";

/**
 * Ari, Hack Club's review platform. Shipping a game sends it to Ari; Ari's reviewers decide,
 * and the decision comes back to /api/ari/webhook. Ari is the only reviewer: the admin dashboard
 * just shows the queue. Every decision is copied into Airtable, where a person submits to Unified.
 */

/** Where an admin opens Ari. */
export const ARI_DASHBOARD_URL = "https://ari.hackclub.com";

export const ariConfigured = Boolean(env.ARI_PROGRAM_ID && env.ARI_SIGNING_SECRET);
export const ariWebhookConfigured = Boolean(env.ARI_WEBHOOK_SECRET);

const client = ariConfigured
  ? new Ari({ programId: env.ARI_PROGRAM_ID!, signingSecret: env.ARI_SIGNING_SECRET! })
  : null;

/** Reviewers may open a ship weeks later, so Ari gets a long-lived screenshot link. */
const SCREENSHOT_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const describeError = (e: unknown) =>
  e instanceof AriInputError
    ? `${e.field}: ${e.message}`
    : e instanceof AriApiError
      ? `Ari ${e.status} ${e.code}: ${e.message}`
      : e instanceof Error
        ? e.message
        : "Couldn't reach Ari.";

/** Send a shipped game to Ari. Never throws: failures are stored on the game for the admin card. */
export async function submitToAri(gameId: string, origin: string) {
  if (!client) return;
  const game = await db.game.findUnique({
    where: { id: gameId },
    include: { user: { select: { name: true, email: true, slackId: true } } },
  });
  if (game?.status !== "SHIPPED") return;

  const fail = (message: string) =>
    db.game.update({ where: { id: gameId }, data: { ariError: message.slice(0, 500) } });

  const { user } = game;
  if (!user.email || !user.slackId) return fail("The maker has no email or Slack ID on their Hack Club account.");
  if (!game.sourceUrl || !game.playUrl) return fail("The game needs a source link and a play link.");

  const seconds = game.claimedSeconds ?? game.trackedSeconds ?? 0;
  const hours = Math.min(1000, Math.round((seconds / 3600) * 100) / 100);

  try {
    const result = await client.ships.create({
      external_id: game.id,
      title: game.title,
      description: game.pitch,
      maker: {
        email: user.email,
        name: user.name ?? user.email,
        slack_id: user.slackId,
        // Time Scare already counted, for games without (or beyond) a Hackatime project.
        ...(hours > 0 ? { program_hours: hours } : {}),
      },
      repo_url: game.sourceUrl,
      demo_url: game.playUrl,
      thumbnail_url: signedScreenshotUrl(origin, game.id, SCREENSHOT_TTL_MS),
      ...(game.hackatimeProject ? { hackatime_projects: [game.hackatimeProject] } : {}),
      // A game Ari has seen before is being shipped again after a send-back.
      ...(game.ariShipId ? { is_update: true, update_message: "Shipped again after changes." } : {}),
      meta: {
        engine: game.engine ?? null,
        hours_source: game.claimedSeconds != null ? "edited by maker" : game.hackatimeProject ? "hackatime" : "none",
      },
    });
    await db.game.update({
      where: { id: gameId },
      data: { ariShipId: result.id, ariSyncedAt: new Date(), ariError: null },
    });
  } catch (e) {
    // Already in Ari's queue: nothing to resend, and not an error.
    if (e instanceof AriApiError && e.code === "already_queued") {
      await db.game.update({ where: { id: gameId }, data: { ariError: null, ariSyncedAt: new Date() } });
      return;
    }
    console.error("[ari] submit failed", gameId, e);
    await fail(describeError(e));
  }
}

const ARI_ACTOR = { userId: "ari", identity: "ari" };
const approvedHours = (review: { approved_hours?: number; approved_minutes?: number }) =>
  Math.max(0, Math.round((review.approved_hours ?? (review.approved_minutes ?? 0) / 60) * 100) / 100);

const detailOf = (
  decision: ReviewDetail["decision"],
  review: { note_to_maker: string; reviewer: { email: string } | null; justification?: ReviewDetail["justification"] },
): ReviewDetail => ({
  decision,
  reviewer: review.reviewer?.email ?? null,
  note: review.note_to_maker,
  justification: review.justification ?? {},
});

/**
 * Apply one Ari webhook delivery. Runs at most once per delivery id; throws on failure so the
 * route answers non-2xx and Ari retries later.
 */
export async function applyAriEvent(deliveryId: string, event: AriWebhookEvent, origin: string) {
  if (await db.ariDelivery.findUnique({ where: { id: deliveryId } })) return;

  const gameId = "external_id" in event && typeof event.external_id === "string" ? event.external_id : null;
  const by = (e: { review?: { reviewer: { email: string } | null } }) =>
    `ari:${e.review?.reviewer?.email ?? "reviewer"}`;

  let mirror: Parameters<typeof syncReview>[2] | "resync" | null = null;

  await db.$transaction(async (tx) => {
    const game = gameId ? await tx.game.findUnique({ where: { id: gameId } }) : null;
    const note = (action: string, detail: Record<string, unknown>) =>
      tx.adminAudit.create({
        data: {
          actorUserId: ARI_ACTOR.userId,
          actorIdentity: ARI_ACTOR.identity,
          action,
          targetType: "game",
          targetId: gameId ?? "unknown",
          detail: JSON.parse(JSON.stringify({ delivery: deliveryId, ...detail })) as object,
        },
      });

    if (game) {
      switch (event.event) {
        case "review.approved": {
          const hours = approvedHours(event.review);
          const pumpkins = Math.floor(hours * PUMPKINS_PER_HOUR);
          const { count } = await tx.game.updateMany({
            where: { id: game.id, status: "SHIPPED", OR: [{ reviewStatus: null }, { reviewStatus: "PENDING" }] },
            data: {
              reviewStatus: "APPROVED",
              awardedPumpkins: pumpkins,
              reviewHours: hours,
              reviewDetail: { ...detailOf("approved", event.review) },
              reviewNote: event.review.note_to_maker || null,
              reviewedAt: new Date(),
              reviewedBy: by(event),
            },
          });
          if (count > 0) {
            await tx.user.update({ where: { id: game.userId }, data: { pumpkins: { increment: pumpkins } } });
            await note("ship.approve", { title: game.title, pumpkins, hours: event.review.approved_hours ?? null });
            mirror = { status: "Accepted" };
          }
          break;
        }
        case "review.changes":
        case "review.rejected": {
          const reason = event.review.note_to_maker || (event.event === "review.rejected" ? "Rejected in review." : "Changes requested in review.");
          const { count } = await tx.game.updateMany({
            where: { id: game.id, status: "SHIPPED", OR: [{ reviewStatus: null }, { reviewStatus: "PENDING" }] },
            data: {
              status: "BREWING",
              reviewStatus: "REJECTED",
              reviewNote: reason,
              reviewHours: null,
              reviewDetail: { ...detailOf(event.decision, event.review) },
              reviewedAt: new Date(),
              reviewedBy: by(event),
            },
          });
          if (count > 0) {
            await note(event.event === "review.rejected" ? "ship.reject" : "ship.changes", { title: game.title, note: reason });
            mirror = { status: event.event === "review.rejected" ? "Rejected" : "Resubmission Requested", reason };
          }
          break;
        }
        case "review.reverted":
        case "review.requeued": {
          // Undo an earlier approval: take back what's left of the award and return it to the queue.
          if (game.reviewStatus === "APPROVED") {
            const user = await tx.user.findUniqueOrThrow({ where: { id: game.userId }, select: { pumpkins: true } });
            const back = Math.min(user.pumpkins, game.awardedPumpkins ?? 0);
            await tx.user.update({ where: { id: game.userId }, data: { pumpkins: { decrement: back } } });
            await tx.game.update({
              where: { id: game.id },
              data: {
                reviewStatus: "PENDING",
                awardedPumpkins: null,
                reviewHours: null,
                reviewDetail: Prisma.DbNull,
                reviewNote: null,
                reviewedAt: null,
                reviewedBy: null,
              },
            });
            await note("ship.revert", { title: game.title, clawedBack: back, owed: (game.awardedPumpkins ?? 0) - back });
            mirror = { status: "Pending" };
          } else if (game.reviewStatus === "REJECTED" && game.status === "BREWING") {
            await tx.game.update({
              where: { id: game.id },
              data: {
                status: "SHIPPED",
                reviewStatus: "PENDING",
                reviewHours: null,
                reviewDetail: Prisma.DbNull,
                reviewNote: null,
                reviewedAt: null,
                reviewedBy: null,
              },
            });
            await note("ship.revert", { title: game.title });
            mirror = { status: "Pending" };
          }
          break;
        }
        case "ship.updated":
          // A reviewer corrected the project's details in Ari; Airtable re-reads Scare's copy.
          await note("ari.ship.updated", { changes: JSON.parse(JSON.stringify(event.changes ?? null)) as unknown });
          mirror = "resync";
          break;
        default:
          await note(`ari.${event.event === "unknown" ? event.event_name : event.event}`, {});
      }
    }
    await tx.ariDelivery.create({ data: { id: deliveryId, event: event.event, gameId } });
  });

  if (!gameId || !mirror) return;
  if (mirror === "resync") {
    const g = await db.game.findUnique({ where: { id: gameId }, select: { status: true, reviewStatus: true } });
    if (g?.status === "SHIPPED") await syncShip(gameId, origin, g.reviewStatus === "APPROVED" ? "Accepted" : "Pending");
  } else {
    await syncReview(gameId, origin, mirror);
  }
}
