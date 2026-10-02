import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { findItem } from "~/lib/shop-catalog";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { rateLimit } from "~/server/rate-limit";

/** Open (not yet triaged) suggestions one person can have at once. */
const OPEN_SUGGESTIONS = 10;

/** An empty optional field is stored as null. */
const blank = (v: string | undefined) => (v === undefined || v === "" ? null : v);

export const shopRouter = createTRPCRouter({
  orders: protectedProcedure.query(({ ctx }) =>
    ctx.db.order.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      // Not handledBy: that's the admin's identity.
      select: { id: true, itemName: true, pumpkins: true, status: true, createdAt: true },
    }),
  ),

  buy: protectedProcedure
    .input(z.object({ itemId: z.string(), details: z.string().trim().max(500).optional() }))
    .mutation(async ({ ctx, input }) => {
      const item = findItem(input.itemId);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "That item isn't in the shop." });

      const details = input.details ?? "";
      if (item.ask && !details) {
        throw new TRPCError({ code: "BAD_REQUEST", message: item.ask.missing });
      }
      if (item.pick && !item.pick.options.includes(details)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pick one of the options first." });
      }
      if (item.ask?.url && !z.string().url().safeParse(details).success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Paste the full link, starting with https://" });
      }

      const userId = ctx.session.user.id;
      return ctx.db.$transaction(async (tx) => {
        // Spend only if the balance covers it, in one statement, so two orders can't overdraw.
        const { count } = await tx.user.updateMany({
          where: { id: userId, pumpkins: { gte: item.pumpkins } },
          data: { pumpkins: { decrement: item.pumpkins } },
        });
        if (count === 0) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "You don't have enough Pumpkins for that yet." });
        }
        return tx.order.create({
          data: {
            userId,
            itemId: item.id,
            itemName: item.name,
            pumpkins: item.pumpkins,
            usd: item.usd,
            details: details || null,
          },
        });
      });
    }),

  /** Your own suggestions, newest first, so you can see what happened to them. */
  suggestions: protectedProcedure.query(({ ctx }) =>
    ctx.db.suggestion.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, status: true, adminNote: true },
    }),
  ),

  /** Suggest something for the shop. It goes to /admin/suggestions. */
  suggest: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2, "Say what the item is.").max(80, "Keep the name under 80 characters."),
        link: z
          .string()
          .trim()
          .max(500)
          .url("Paste the full link, starting with https://")
          .refine((u) => /^https?:\/\//i.test(u), "Paste the full link, starting with https://")
          .optional()
          .or(z.literal("")),
        why: z.string().trim().max(300, "Keep it under 300 characters.").optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (!rateLimit(`suggest:${userId}`, 5, 60 * 60_000).ok) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "That's a lot of ideas. Try again in an hour." });
      }
      const open = await ctx.db.suggestion.count({ where: { userId, status: "NEW" } });
      if (open >= OPEN_SUGGESTIONS) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `You have ${OPEN_SUGGESTIONS} suggestions waiting already. We'll get to them.`,
        });
      }
      return ctx.db.suggestion.create({
        data: { userId, name: input.name, link: blank(input.link), why: blank(input.why) },
        select: { id: true, name: true },
      });
    }),

  /** Cancel a pending order and refund its Pumpkins. */
  cancel: protectedProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) =>
    ctx.db.$transaction(async (tx) => {
      const where = { id: input.id, userId: ctx.session.user.id, status: "PENDING" as const };
      const order = await tx.order.findFirst({ where });
      // Flip the status only if it's still pending, so a double click can't refund twice.
      const { count } = order
        ? await tx.order.updateMany({ where, data: { status: "CANCELLED" } })
        : { count: 0 };
      if (!order || count === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "That order can't be cancelled." });
      }
      await tx.user.update({
        where: { id: order.userId },
        data: { pumpkins: { increment: order.pumpkins } },
      });
      return { ok: true };
    }),
  ),
});
