import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { type PrismaClient } from "../../../../generated/prisma";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { toTRPC } from "~/server/api/routers/hackatime";
import { projectSeconds } from "~/server/hackatime";

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

/** Only web links: z.string().url() alone accepts javascript:, data: and the like, which become XSS in an href. */
const httpUrl = (message: string) =>
  z
    .string()
    .trim()
    .max(500)
    .refine((v) => {
      try {
        const { protocol } = new URL(v);
        return protocol === "https:" || protocol === "http:";
      } catch {
        return false;
      }
    }, message);

/** Caps how many games one account can store. */
const MAX_GAMES = 25;

const gameInput = z.object({
  title: z.string().trim().min(1, "Give it a name").max(80),
  pitch: z.string().trim().min(1, "Describe your project in a sentence or two").max(280),
  engine: z.string().trim().max(40).optional(),
  sourceUrl: httpUrl("That doesn't look like a link. Include https://"),
  ...timeFields,
});

export const gameRouter = createTRPCRouter({
  mine: protectedProcedure.query(({ ctx }) =>
    ctx.db.game.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
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
      });
    }),

  /** Pick (or clear) a Hackatime project for a game and optionally override its time. */
  setTime: protectedProcedure
    .input(z.object({ id: z.string().max(40), ...timeFields }))
    .mutation(async ({ ctx, input }) => {
      const game = await ownGame(ctx.db, ctx.session.user.id, input.id);
      const time = await resolveTime(
        ctx.session.user.id,
        input.hackatimeProject,
        input.claimedHours,
      );
      return ctx.db.game.update({ where: { id: game.id }, data: time });
    }),

  ship: protectedProcedure
    .input(
      z.object({
        id: z.string().max(40),
        playUrl: httpUrl("Paste the link people will use to play it"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const game = await ownGame(ctx.db, ctx.session.user.id, input.id);
      // Freeze Hackatime's total at the moment of shipping. If Hackatime is down, keep the last read.
      let trackedSeconds = game.trackedSeconds;
      if (game.hackatimeProject) {
        trackedSeconds =
          (await projectSeconds(
            ctx.session.user.id,
            game.hackatimeProject,
          ).catch(() => null)) ?? trackedSeconds;
      }
      return ctx.db.game.update({
        where: { id: game.id },
        data: {
          playUrl: input.playUrl,
          status: "SHIPPED",
          shippedAt: new Date(),
          trackedSeconds,
        },
      });
    }),

  /** Edit a shipped game. The play link stays required, and time stays frozen unless the project changes. */
  updateShipped: protectedProcedure
    .input(
      gameInput.extend({
        id: z.string().max(40),
        playUrl: httpUrl("That doesn't look like a link. Include https://"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const game = await ownGame(ctx.db, ctx.session.user.id, input.id);
      if (game.status !== "SHIPPED") throw new TRPCError({ code: "BAD_REQUEST" });
      const { id, hackatimeProject, claimedHours, ...rest } = input;
      const project = hackatimeProject ?? null;
      // Same project: keep the total frozen at shipping. A new project reads its total now.
      const time =
        project === game.hackatimeProject
          ? {
              trackedSeconds: game.trackedSeconds,
              claimedSeconds: claimedFor(game.trackedSeconds, claimedHours),
            }
          : await resolveTime(ctx.session.user.id, project, claimedHours);
      return ctx.db.game.update({
        where: { id },
        data: { ...rest, engine: rest.engine ?? null, ...time },
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string().max(40) }))
    .mutation(async ({ ctx, input }) => {
      const { count } = await ctx.db.game.deleteMany({
        where: { id: input.id, userId: ctx.session.user.id, status: "BREWING" },
      });
      if (count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true };
    }),
});
