"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";

import { audit, requireAdminAction } from "~/server/admin";
import { airtableConfigured, syncReview, syncShip } from "~/server/airtable";
import { db } from "~/server/db";
import { originFromHeaders } from "~/server/origin";

/** After the response: keep the Airtable record's Status in step with the review. */
async function mirrorReview(gameId: string, review: Parameters<typeof syncReview>[2]) {
  const origin = originFromHeaders(await headers());
  after(() => syncReview(gameId, origin, review));
}

export type ActionState = { ok?: string; error?: string } | null;

const SLOW: ActionState = { error: "Slow down: too many admin actions in a minute." };

const id = z.string().min(1).max(40);
const note = z.string().trim().max(1000).optional();

function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, form: FormData): T | { error: string } {
  const r = schema.safeParse(Object.fromEntries(form));
  return r.success ? r.data : { error: r.error.issues[0]?.message ?? "Check the form." };
}

const isError = (v: unknown): v is { error: string } =>
  typeof v === "object" && v !== null && "error" in v;

/** Every action reports back instead of throwing, so the form can show what happened. */
async function run(fn: () => Promise<string>): Promise<ActionState> {
  try {
    return { ok: await fn() };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

/* ------------------------------------------------------------ ships */

export async function approveShip(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdminAction();
  if (!admin) return SLOW;
  const input = parse(
    z.object({
      gameId: id,
      pumpkins: z.coerce.number().int("Whole Pumpkins only").min(0).max(100_000),
      note,
    }),
    form,
  );
  if (isError(input)) return input;

  return run(() =>
    db.$transaction(async (tx) => {
      // Only a shipped game that hasn't been reviewed yet; a double click can't award twice.
      const { count } = await tx.game.updateMany({
        where: { id: input.gameId, status: "SHIPPED", OR: [{ reviewStatus: null }, { reviewStatus: "PENDING" }] },
        data: {
          reviewStatus: "APPROVED",
          awardedPumpkins: input.pumpkins,
          reviewNote: input.note ?? null,
          reviewedAt: new Date(),
          reviewedBy: admin.identity,
        },
      });
      if (count === 0) throw new Error("That game isn't waiting for review any more.");
      const game = await tx.game.findUniqueOrThrow({
        where: { id: input.gameId },
        select: { userId: true, title: true },
      });
      await tx.user.update({
        where: { id: game.userId },
        data: { pumpkins: { increment: input.pumpkins } },
      });
      await audit(tx, admin, "ship.approve", { type: "game", id: input.gameId }, {
        title: game.title,
        pumpkins: input.pumpkins,
        note: input.note ?? null,
      });
      revalidatePath("/admin", "layout");
      return `Approved "${game.title}" and awarded ${input.pumpkins} Pumpkins.`;
    }),
  ).then(async (r) => {
    if (r?.ok) await mirrorReview(input.gameId, { status: "Accepted" });
    return r;
  });
}

export async function rejectShip(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdminAction();
  if (!admin) return SLOW;
  const input = parse(
    z.object({ gameId: id, note: z.string().trim().min(1, "Say what needs fixing.").max(1000) }),
    form,
  );
  if (isError(input)) return input;

  return run(() =>
    db.$transaction(async (tx) => {
      // Back to brewing, so they can fix it and ship again.
      const { count } = await tx.game.updateMany({
        where: { id: input.gameId, status: "SHIPPED", OR: [{ reviewStatus: null }, { reviewStatus: "PENDING" }] },
        data: {
          status: "BREWING",
          reviewStatus: "REJECTED",
          reviewNote: input.note,
          reviewedAt: new Date(),
          reviewedBy: admin.identity,
        },
      });
      if (count === 0) throw new Error("That game isn't waiting for review any more.");
      const game = await tx.game.findUniqueOrThrow({ where: { id: input.gameId }, select: { title: true } });
      await audit(tx, admin, "ship.reject", { type: "game", id: input.gameId }, {
        title: game.title,
        note: input.note,
      });
      revalidatePath("/admin", "layout");
      return `Sent "${game.title}" back with your note.`;
    }),
  ).then(async (r) => {
    if (r?.ok) await mirrorReview(input.gameId, { status: "Resubmission Requested", reason: input.note });
    return r;
  });
}

/** Re-send a game to Airtable now, e.g. after fixing whatever made the last sync fail. */
export async function resyncAirtable(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdminAction();
  if (!admin) return SLOW;
  const input = parse(z.object({ gameId: id }), form);
  if (isError(input)) return input;
  if (!airtableConfigured) return { error: "Airtable isn't configured on this server." };

  const game = await db.game.findUnique({ where: { id: input.gameId }, select: { reviewStatus: true, status: true } });
  if (game?.status !== "SHIPPED") return { error: "Only shipped games sync to Airtable." };
  await syncShip(
    input.gameId,
    originFromHeaders(await headers()),
    game.reviewStatus === "APPROVED" ? "Accepted" : "Pending",
  );
  const synced = await db.game.findUnique({ where: { id: input.gameId }, select: { airtableError: true } });
  await db.adminAudit.create({
    data: {
      actorUserId: admin.userId,
      actorIdentity: admin.identity,
      action: "ship.airtable_resync",
      targetType: "game",
      targetId: input.gameId,
      detail: { error: synced?.airtableError ?? null },
    },
  });
  revalidatePath("/admin", "layout");
  return synced?.airtableError ? { error: synced.airtableError } : { ok: "Synced to Airtable." };
}

/* ------------------------------------------------------------ orders */

export async function fulfillOrder(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdminAction();
  if (!admin) return SLOW;
  const input = parse(z.object({ orderId: id, note }), form);
  if (isError(input)) return input;

  return run(() =>
    db.$transaction(async (tx) => {
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
    }),
  );
}

export async function rejectOrder(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdminAction();
  if (!admin) return SLOW;
  const input = parse(
    z.object({ orderId: id, note: z.string().trim().min(1, "Say why it was rejected.").max(1000) }),
    form,
  );
  if (isError(input)) return input;

  return run(() =>
    db.$transaction(async (tx) => {
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
    }),
  );
}

/* ------------------------------------------------------------ suggestions */

async function resolveSuggestion(form: FormData, status: "ADDED" | "DECLINED"): Promise<ActionState> {
  const admin = await requireAdminAction();
  if (!admin) return SLOW;
  const input = parse(z.object({ suggestionId: id, note }), form);
  if (isError(input)) return input;

  return run(() =>
    db.$transaction(async (tx) => {
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
    }),
  );
}

/** The item is in the shop now (add it to the catalog first). The suggester sees "Added". */
export async function addSuggestion(_: ActionState, form: FormData): Promise<ActionState> {
  return resolveSuggestion(form, "ADDED");
}

export async function declineSuggestion(_: ActionState, form: FormData): Promise<ActionState> {
  return resolveSuggestion(form, "DECLINED");
}

/* ------------------------------------------------------------ users */

export async function adjustPumpkins(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdminAction();
  if (!admin) return SLOW;
  const input = parse(
    z.object({
      userId: id,
      delta: z.coerce
        .number()
        .int("Whole Pumpkins only")
        .min(-100_000)
        .max(100_000)
        .refine((n) => n !== 0, "Enter a number other than 0."),
      reason: z.string().trim().min(1, "Give a reason; it goes in the audit log.").max(500),
    }),
    form,
  );
  if (isError(input)) return input;

  return run(() =>
    db.$transaction(async (tx) => {
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
    }),
  );
}

export async function resetOnboarding(_: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireAdminAction();
  if (!admin) return SLOW;
  const input = parse(z.object({ userId: id }), form);
  if (isError(input)) return input;

  return run(() =>
    db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: input.userId },
        data: { onboardedAt: null, tourSeenAt: null },
      });
      await audit(tx, admin, "user.reset_onboarding", { type: "user", id: input.userId });
      revalidatePath("/admin", "layout");
      return "Onboarding reset. They'll see the carving table on their next visit.";
    }),
  );
}
