import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  HackatimeError,
  hackatimeConfigured,
  listProjects,
  unlink,
} from "~/server/hackatime";

export function toTRPC(e: unknown): never {
  if (e instanceof HackatimeError) {
    throw new TRPCError({
      code:
        e.reason === "not-linked"
          ? "PRECONDITION_FAILED"
          : e.reason === "revoked"
            ? "UNAUTHORIZED"
            : "BAD_GATEWAY",
      message:
        e.reason === "not-linked"
          ? "Link Hackatime first."
          : e.reason === "revoked"
            ? "Hackatime access was revoked."
            : "Hackatime didn't answer. Try again in a minute.",
      cause: e,
    });
  }
  throw e;
}

export const hackatimeRouter = createTRPCRouter({
  status: protectedProcedure.query(async ({ ctx }) => {
    const link = await ctx.db.hackatimeLink.findUnique({
      where: { userId: ctx.session.user.id },
      select: {
        slackId: true,
        githubUsername: true,
        trustLevel: true,
        createdAt: true,
      },
    });
    return {
      configured: hackatimeConfigured,
      linked: Boolean(link),
      link,
      // Hackatime and Hack Club Auth should agree on who this is.
      slackMatches:
        link?.slackId && ctx.session.user.slackId
          ? link.slackId === ctx.session.user.slackId
          : null,
    };
  }),

  projects: protectedProcedure.query(async ({ ctx }) => {
    try {
      const projects = await listProjects(ctx.session.user.id);
      return projects.map((p) => ({
        name: p.name,
        seconds: p.total_seconds,
        lastActive: p.most_recent_heartbeat,
        languages: p.languages,
      }));
    } catch (e) {
      toTRPC(e);
    }
  }),

  unlink: protectedProcedure.mutation(async ({ ctx }) => {
    await unlink(ctx.session.user.id);
    return { ok: true };
  }),
});
