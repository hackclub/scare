import { TRPCError } from "@trpc/server";
import { after } from "next/server";
import { z } from "zod";

import { Prisma, type PrismaClient } from "../../../../generated/prisma";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { toTRPC } from "~/server/api/routers/hackatime";
import { syncShip } from "~/server/airtable";
import { submitToAri } from "~/server/ari";
import { projectSeconds } from "~/server/hackatime";
import { originFromHeaders } from "~/server/origin";
import { httpUrl } from "~/lib/safe-url";

/** A Hackatime project to pull time from, and the participant's own figure if they edited it. */
const timeFields = {
  hackatimeProject: z.string().trim().max(200).nullish(),
  claimedHours: z
    .number({ invalid_type_error: "Hours must be a number" })
    .min(0, "Hours can't be negative")
    .max(2000, "That's more hours than there are")
    .nullish(),
};

/**
 * Resolve time server-side: re-read the project's total from Hackatime rather than trusting the
 * client, and only keep claimedSeconds when it really differs from what Hackatime tracked.
 */
async function resolveTime(
  userId: string,
  project: string | null | undefined,
  claimedHours: number | null | undefined,
) {
  let trackedSeconds: number | null = null;
  if (project) {
    try {
      trackedSeconds = await projectSeconds(userId, project);
    } catch (e) {
      toTRPC(e);
    }
    if (trackedSeconds === null) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "That Hackatime project wasn't found.",
      });
    }
  }
  return {
    hackatimeProject: project ?? null,
    trackedSeconds,
    claimedSeconds: claimedFor(trackedSeconds, claimedHours),
  };
}

/** The participant's own figure, kept only when it really differs from what Hackatime tracked. */
function claimedFor(
  trackedSeconds: number | null,
  claimedHours: number | null | undefined,
) {
  const claimed =
    claimedHours === null || claimedHours === undefined
      ? null
      : Math.round(claimedHours * 3600);
  const edited =
    claimed !== null &&
    (trackedSeconds === null || Math.abs(claimed - trackedSeconds) >= 60);
  return edited ? claimed : null;
}

async function ownGame(db: PrismaClient, userId: string, id: string) {
  const game = await db.game.findFirst({ where: { id, userId } });
  if (!game) throw new TRPCError({ code: "NOT_FOUND" });
  return game;
}

const SHIPPED_LOCKED = "Shipped projects can't be edited.";

/** Shipped games are locked: what the reviewer checked is what stays on record. */
async function ownBrewingGame(db: PrismaClient, userId: string, id: string) {
  const game = await ownGame(db, userId, id);
  if (game.status !== "BREWING") throw new TRPCError({ code: "FORBIDDEN", message: SHIPPED_LOCKED });
  return game;
}

/**
 * What a participant sees of their own game. Leaves out who reviewed it (an admin's identity)
 * and the Airtable bookkeeping, which are for admins only.
 */
const participantGame = {
  id: true,
  title: true,
  pitch: true,
  engine: true,
  sourceUrl: true,
  playUrl: true,
  status: true,
  hackatimeProject: true,
  trackedSeconds: true,
  claimedSeconds: true,
  shippedAt: true,
  reviewStatus: true,
  reviewNote: true,
  awardedPumpkins: true,
  createdAt: true,
  // Only whether there's a screenshot and when it changed; the bytes come from its own route.
  screenshot: { select: { updatedAt: true } },
} satisfies Prisma.GameSelect;

/** Caps how many games one account can store. */
const MAX_GAMES = 25;

const gameInput = z.object({
  title: z.string().trim().min(1, "Give it a name").max(80),
  pitch: z.string().trim().min(1, "Describe your project in a sentence or two").max(280),
  engine: z.string().trim().max(40).optional(),
  sourceUrl: httpUrl("Link your source code"),
  ...timeFields,
});

export const gameRouter = createTRPCRouter({
  mine: protectedProcedure.query(({ ctx }) =>
    ctx.db.game.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      select: participantGame,
    }),
  ),

  create: protectedProcedure
    .input(gameInput)
    .mutation(async ({ ctx, input }) => {
      const { hackatimeProject, claimedHours, ...rest } = input;
      if ((await ctx.db.game.count({ where: { userId: ctx.session.user.id } })) >= MAX_GAMES)
        throw new TRPCError({ code: "FORBIDDEN", message: "That's the most games one account can hold." });
      const time = await resolveTime(
        ctx.session.user.id,
        hackatimeProject,
        claimedHours,
      );
      return ctx.db.game.create({
        data: {
          ...rest,
          ...time,
          engine: rest.engine ?? null,
          userId: ctx.session.user.id,
        },
        select: participantGame,
      });
    }),

  /** Pick (or clear) a Hackatime project for a game and optionally override its time. */
  setTime: protectedProcedure
    .input(z.object({ id: z.string().max(40), ...timeFields }))
    .mutation(async ({ ctx, input }) => {
      const game = await ownBrewingGame(ctx.db, ctx.session.user.id, input.id);
      const time = await resolveTime(
        ctx.session.user.id,
        input.hackatimeProject,
        input.claimedHours,
      );
      return ctx.db.game.update({ where: { id: game.id }, data: time, select: participantGame });
    }),

  ship: protectedProcedure
    .input(
      z.object({
        id: z.string().max(40),
        playUrl: httpUrl("Paste the link people will use to play it"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const game = await ownBrewingGame(ctx.db, ctx.session.user.id, input.id);
      const shot = await ctx.db.screenshot.findUnique({ where: { gameId: game.id }, select: { id: true } });
      if (!shot) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Add a screenshot before you ship." });
      }
      // Ari won't take a ship with no time on it, so catch that here rather than after shipping.
      if (!game.hackatimeProject && !game.claimedSeconds) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Pick a Hackatime project or enter your hours before you ship." });
      }
      // Freeze Hackatime's total at the moment of shipping. If Hackatime is down, keep the last read.
      let trackedSeconds = game.trackedSeconds;
      if (game.hackatimeProject) {
        trackedSeconds =
          (await projectSeconds(
            ctx.session.user.id,
            game.hackatimeProject,
          ).catch(() => null)) ?? trackedSeconds;
      }
      // Only from brewing, in one statement, so an approved game can't be shipped (and paid) again.
      const { count } = await ctx.db.game.updateMany({
        where: { id: game.id, status: "BREWING" },
        data: {
          playUrl: input.playUrl,
          status: "SHIPPED",
          shippedAt: new Date(),
          // Into the review queue (again, if it was sent back), without the last review's leftovers.
          reviewStatus: "PENDING",
          reviewNote: null,
          reviewHours: null,
          reviewDetail: Prisma.DbNull,
          reviewedAt: null,
          reviewedBy: null,
          trackedSeconds,
        },
      });
      if (count === 0) throw new TRPCError({ code: "FORBIDDEN", message: SHIPPED_LOCKED });
      const shipped = await ctx.db.game.findUniqueOrThrow({ where: { id: game.id }, select: participantGame });
      // Mirror to Airtable once the response is out; a slow or failing Airtable never blocks shipping.
      const origin = originFromHeaders(ctx.headers);
      // In order: if Ari bounces the ship, its send-back must land in Airtable after the Pending.
      after(async () => {
        await syncShip(shipped.id, origin, "Pending");
        await submitToAri(shipped.id, origin);
      });
      return shipped;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().max(40) }))
    .mutation(async ({ ctx, input }) => {
      const { count } = await ctx.db.game.deleteMany({
        // Once shipped, a game stays on record (it has an Airtable row and an Ari history); fix and re-ship instead.
        where: { id: input.id, userId: ctx.session.user.id, status: "BREWING", shippedAt: null },
      });
      if (count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true };
    }),
});
