import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { findItem } from "~/lib/shop-catalog";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const shopRouter = createTRPCRouter({
  orders: protectedProcedure.query(({ ctx }) =>
    ctx.db.order.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
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
