import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type Admin, audit } from "~/server/admin";
import { airtableConfigured, syncShip } from "~/server/airtable";
import { ariConfigured, submitToAri, withdrawFromAri } from "~/server/ari";
import { db } from "~/server/db";
import { httpUrl } from "~/lib/safe-url";

/**
 * Every admin write, shared by the dashboard's server actions and the admin MCP endpoint.
 * Each op validates its input, does the change and its audit row in one transaction, and
 * returns a message for the admin. Failures throw with a message that's safe to show.
 */

const id = z.string().min(1).max(40);
const note = z.string().trim().max(1000).optional();

export const schemas = {
  gameId: z.object({ gameId: id }),
  // Either link can be left out (the MCP tool); the dashboard form always sends both.
  editGameLinks: z.object({
    gameId: id,
    playUrl: httpUrl("Paste the play link.").optional(),
    sourceUrl: httpUrl("Paste the source link.").optional(),
  }),
  fulfillOrder: z.object({ orderId: id, note }),
  rejectOrder: z.object({ orderId: id, note: z.string().trim().min(1, "Say why it was rejected.").max(1000) }),
  suggestion: z.object({ suggestionId: id, note }),
  adjustPumpkins: z.object({
    userId: id,
    delta: z.coerce
      .number()
      .int("Whole Pumpkins only")
      .min(-100_000)
      .max(100_000)
      .refine((n) => n !== 0, "Enter a number other than 0."),
    reason: z.string().trim().min(1, "Give a reason; it goes in the audit log.").max(500),
  }),
  userId: z.object({ userId: id }),
};

type In<K extends keyof typeof schemas> = z.infer<(typeof schemas)[K]>;

/* ------------------------------------------------------------ ships */

/** Send a shipped game to Ari again, e.g. after fixing whatever made the last send fail. */
export async function resendAri(admin: Admin, input: In<"gameId">, origin: string) {
  if (!ariConfigured) throw new Error("Ari isn't configured on this server.");
  const game = await db.game.findUnique({ where: { id: input.gameId }, select: { status: true } });
  if (game?.status !== "SHIPPED") throw new Error("Only shipped games go to Ari.");
  await submitToAri(input.gameId, origin);
  const after = await db.game.findUnique({ where: { id: input.gameId }, select: { ariShipId: true, ariError: true } });
  await db.$transaction((tx) => audit(tx, admin, "ari.resend", { type: "game", id: input.gameId }, { error: after?.ariError ?? null }));
  revalidatePath("/admin/ships");
  if (after?.ariError) throw new Error(`Ari: ${after.ariError}`);
  return `In Ari as ${after?.ariShipId}. New ships sit in "processing" while Ari gathers evidence.`;
}

/** Re-send a game to Airtable now, e.g. after fixing whatever made the last sync fail. */
export async function resyncAirtable(admin: Admin, input: In<"gameId">, origin: string) {
  if (!airtableConfigured) throw new Error("Airtable isn't configured on this server.");
  const game = await db.game.findUnique({ where: { id: input.gameId }, select: { reviewStatus: true, status: true } });
  if (game?.status !== "SHIPPED") throw new Error("Only shipped games sync to Airtable.");
  await syncShip(input.gameId, origin, game.reviewStatus === "APPROVED" ? "Accepted" : "Pending");
  const synced = await db.game.findUnique({ where: { id: input.gameId }, select: { airtableError: true } });
  await db.$transaction((tx) =>
    audit(tx, admin, "ship.airtable_resync", { type: "game", id: input.gameId }, { error: synced?.airtableError ?? null }),
  );
  revalidatePath("/admin", "layout");
  if (synced?.airtableError) throw new Error(synced.airtableError);
  return "Synced to Airtable.";
}

/**
 * Correct a game's play or source link. Makers can't edit a shipped game, so this is how a moved
 * or mistyped link gets fixed. A shipped game is then re-synced to Airtable, and while Ari still has
 * it open it's withdrawn and sent again: Ari won't change an open submission (a plain resend is
 * just already_queued). Once Ari has approved it, Ari keeps the links it reviewed.
 */
export async function editGameLinks(admin: Admin, input: In<"editGameLinks">, origin: string) {
  const game = await db.game.findUnique({
    where: { id: input.gameId },
    select: { title: true, playUrl: true, sourceUrl: true, status: true, reviewStatus: true, ariShipId: true },
  });
  if (!game) throw new Error("No game with that id.");
  const data = {
    ...(input.playUrl && input.playUrl !== game.playUrl ? { playUrl: input.playUrl } : {}),
    ...(input.sourceUrl && input.sourceUrl !== game.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
  };
  if (Object.keys(data).length === 0) throw new Error("Those are already its links.");
  await db.$transaction(async (tx) => {
    await tx.game.update({ where: { id: input.gameId }, data });
    await audit(tx, admin, "game.edit_links", { type: "game", id: input.gameId }, {
      title: game.title,
      from: { playUrl: game.playUrl, sourceUrl: game.sourceUrl },
      to: data,
    });
  });
  revalidatePath("/admin", "layout");
  if (game.status !== "SHIPPED") return "Links saved.";

  const problems: string[] = [];
  if (airtableConfigured) {
    await syncShip(input.gameId, origin, game.reviewStatus === "APPROVED" ? "Accepted" : "Pending");
    const synced = await db.game.findUnique({ where: { id: input.gameId }, select: { airtableError: true } });
    if (synced?.airtableError) problems.push(`Airtable: ${synced.airtableError}`);
  }
  let ari = "";
  if (ariConfigured && game.reviewStatus === "APPROVED") {
    ari = " Ari already approved it, so Ari keeps the old links.";
  } else if (ariConfigured) {
    try {
      if (game.ariShipId) await withdrawFromAri(input.gameId);
      await submitToAri(input.gameId, origin, "Links corrected by a Scare admin.");
      const after = await db.game.findUnique({ where: { id: input.gameId }, select: { ariShipId: true, ariError: true } });
      if (after?.ariError) problems.push(`Ari: ${after.ariError}`);
      else ari = ` Resent to Ari as ${after?.ariShipId}.`;
    } catch (e) {
      problems.push(`Ari withdraw: ${e instanceof Error ? e.message : "failed"}. Ari still has the old links.`);
    }
  }
  if (problems.length > 0) throw new Error(`Links saved, but ${problems.join(" ")}`);
  return `Links saved and synced to Airtable.${ari}`;
}

/* ------------------------------------------------------------ orders */

export function fulfillOrder(admin: Admin, input: In<"fulfillOrder">) {
  return db.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: input.orderId, status: "PENDING" },
      data: {
        status: "FULFILLED",
        adminNote: input.note ?? null,
        handledAt: new Date(),
        handledBy: admin.identity,
      },
    });
    if (count === 0) throw new Error("That order isn't pending any more.");
    const order = await tx.order.findUniqueOrThrow({ where: { id: input.orderId }, select: { itemName: true } });
    await audit(tx, admin, "order.fulfill", { type: "order", id: input.orderId }, {
      item: order.itemName,
      note: input.note ?? null,
    });
    revalidatePath("/admin", "layout");
    return `Marked "${order.itemName}" fulfilled.`;
  });
}

export function rejectOrder(admin: Admin, input: In<"rejectOrder">) {
  return db.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: input.orderId, status: "PENDING" },
      data: {
        status: "REJECTED",
        adminNote: input.note,
        handledAt: new Date(),
        handledBy: admin.identity,
      },
    });
    if (count === 0) throw new Error("That order isn't pending any more.");
    const order = await tx.order.findUniqueOrThrow({
      where: { id: input.orderId },
      select: { itemName: true, pumpkins: true, userId: true },
    });
    await tx.user.update({
      where: { id: order.userId },
      data: { pumpkins: { increment: order.pumpkins } },
    });
    await audit(tx, admin, "order.reject", { type: "order", id: input.orderId }, {
      item: order.itemName,
      refunded: order.pumpkins,
      note: input.note,
    });
    revalidatePath("/admin", "layout");
    return `Rejected "${order.itemName}" and refunded ${order.pumpkins} Pumpkins.`;
  });
}

/* ------------------------------------------------------------ suggestions */

/** ADDED: the item is in the shop now (add it to the catalog first). The suggester sees "Added". */
export function resolveSuggestion(admin: Admin, input: In<"suggestion">, status: "ADDED" | "DECLINED") {
  return db.$transaction(async (tx) => {
    const { count } = await tx.suggestion.updateMany({
      where: { id: input.suggestionId, status: "NEW" },
      data: { status, adminNote: input.note ?? null, handledAt: new Date(), handledBy: admin.identity },
    });
    if (count === 0) throw new Error("Someone already handled that suggestion.");
    const s = await tx.suggestion.findUniqueOrThrow({ where: { id: input.suggestionId }, select: { name: true } });
    await audit(tx, admin, status === "ADDED" ? "suggestion.add" : "suggestion.decline", {
      type: "suggestion",
      id: input.suggestionId,
    }, { name: s.name, note: input.note ?? null });
    revalidatePath("/admin", "layout");
    return status === "ADDED" ? `Marked "${s.name}" as added.` : `Declined "${s.name}".`;
  });
}

/* ------------------------------------------------------------ users */

export function adjustPumpkins(admin: Admin, input: In<"adjustPumpkins">) {
  return db.$transaction(async (tx) => {
    // Never below zero: a removal only applies if the balance covers it.
    const { count } = await tx.user.updateMany({
      where: { id: input.userId, ...(input.delta < 0 ? { pumpkins: { gte: -input.delta } } : {}) },
      data: { pumpkins: { increment: input.delta } },
    });
    if (count === 0) throw new Error("They don't have that many Pumpkins to remove.");
    const user = await tx.user.findUniqueOrThrow({ where: { id: input.userId }, select: { pumpkins: true } });
    await audit(tx, admin, "user.adjust_pumpkins", { type: "user", id: input.userId }, {
      delta: input.delta,
      balance: user.pumpkins,
      reason: input.reason,
    });
    revalidatePath("/admin", "layout");
    return `${input.delta > 0 ? "Added" : "Removed"} ${Math.abs(input.delta)} Pumpkins. Balance is now ${user.pumpkins}.`;
  });
}

export function resetOnboarding(admin: Admin, input: In<"userId">) {
  return db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: input.userId },
      data: { onboardedAt: null, tourSeenAt: null },
    });
    await audit(tx, admin, "user.reset_onboarding", { type: "user", id: input.userId });
    revalidatePath("/admin", "layout");
    return "Onboarding reset. They'll see the carving table on their next visit.";
  });
}
