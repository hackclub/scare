import { gameRouter } from "~/server/api/routers/game";
import { hackatimeRouter } from "~/server/api/routers/hackatime";
import { onboardingRouter } from "~/server/api/routers/onboarding";
import { shopRouter } from "~/server/api/routers/shop";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  game: gameRouter,
  hackatime: hackatimeRouter,
  shop: shopRouter,
  onboarding: onboardingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.game.mine();
 */
export const createCaller = createCallerFactory(appRouter);
