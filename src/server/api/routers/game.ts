import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const optionalUrl = z
  .string()
  .trim()
  .url("That doesn't look like a link. Include https://")
  .max(500)
  .optional()
  .or(z.literal("").transform(() => undefined));

const gameInput = z.object({
  title: z.string().trim().min(1, "Give it a name").max(80),
  pitch: z
    .string()
    .trim()
    .min(1, "One line on what makes it scary")
    .max(280),
  engine: z.string().trim().max(40).optional(),
  sourceUrl: optionalUrl,
  playUrl: optionalUrl,
});

export const gameRouter = createTRPCRouter({
  mine: protectedProcedure.query(({ ctx }) =>
    ctx.db.game.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    }),
  ),

  create: protectedProcedure.input(gameInput).mutation(({ ctx, input }) =>
    ctx.db.game.create({
      data: {
        ...input,
        engine: input.engine ?? null,
        userId: ctx.session.user.id,
      },
    }),
  ),

  ship: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        playUrl: z
          .string()
          .trim()
          .url("Paste the link people will use to play it"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const game = await ctx.db.game.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!game) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.db.game.update({
        where: { id: game.id },
        data: { playUrl: input.playUrl, status: "SHIPPED", shippedAt: new Date() },
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { count } = await ctx.db.game.deleteMany({
        where: { id: input.id, userId: ctx.session.user.id, status: "BREWING" },
      });
      if (count === 0) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true };
    }),
});
