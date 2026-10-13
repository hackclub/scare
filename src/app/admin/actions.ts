"use server";

import { headers } from "next/headers";
import { type z } from "zod";

import { type Admin, requireAdminAction } from "~/server/admin";
import * as ops from "~/server/admin-ops";
import { originFromHeaders } from "~/server/origin";

export type ActionState = { ok?: string; error?: string } | null;

const SLOW: ActionState = { error: "Slow down: too many admin actions in a minute." };
// Ships are reviewed in Ari, not here; this file only resends ships to Ari and Airtable.
// The logic lives in ~/server/admin-ops so the admin MCP endpoint runs the same code.

/** Gate, parse, run. Every action reports back instead of throwing, so the form can show what happened. */
async function act<T>(
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  form: FormData,
  fn: (admin: Admin, input: T) => Promise<string>,
): Promise<ActionState> {
  const admin = await requireAdminAction();
  if (!admin) return SLOW;
  const r = schema.safeParse(Object.fromEntries(form));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Check the form." };
  try {
    return { ok: await fn(admin, r.data) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

const origin = async () => originFromHeaders(await headers());

/* ------------------------------------------------------------ ships */

export async function resendAri(_: ActionState, form: FormData) {
  return act(ops.schemas.gameId, form, async (a, i) => ops.resendAri(a, i, await origin()));
}

export async function resyncAirtable(_: ActionState, form: FormData) {
  return act(ops.schemas.gameId, form, async (a, i) => ops.resyncAirtable(a, i, await origin()));
}

/* ------------------------------------------------------------ orders */

export async function fulfillOrder(_: ActionState, form: FormData) {
  return act(ops.schemas.fulfillOrder, form, ops.fulfillOrder);
}

export async function rejectOrder(_: ActionState, form: FormData) {
  return act(ops.schemas.rejectOrder, form, ops.rejectOrder);
}

/* ------------------------------------------------------------ suggestions */

export async function addSuggestion(_: ActionState, form: FormData) {
  return act(ops.schemas.suggestion, form, (a, i) => ops.resolveSuggestion(a, i, "ADDED"));
}

export async function declineSuggestion(_: ActionState, form: FormData) {
  return act(ops.schemas.suggestion, form, (a, i) => ops.resolveSuggestion(a, i, "DECLINED"));
}

/* ------------------------------------------------------------ users */

export async function adjustPumpkins(_: ActionState, form: FormData) {
  return act(ops.schemas.adjustPumpkins, form, ops.adjustPumpkins);
}

export async function resetOnboarding(_: ActionState, form: FormData) {
  return act(ops.schemas.userId, form, ops.resetOnboarding);
}
