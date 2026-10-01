import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const onboardingRouter = createTRPCRouter({
  /** The page tour (the lantern's nose) was walked through. */
  tourSeen: protectedProcedure.mutation(({ ctx }) =>
    ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { tourSeenAt: new Date() },
      select: { tourSeenAt: true },
    }),
  ),

  /** Finished or skipped. Either way, the platform stops sending them to /welcome. */
  complete: protectedProcedure.mutation(({ ctx }) =>
    ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { onboardedAt: new Date() },
      select: { onboardedAt: true },
    }),
  ),
});
