import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import { type OIDCConfig } from "next-auth/providers";

import { env } from "~/env";
import { db } from "~/server/db";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      slackId: string | null;
      yswsEligible: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    slackId?: string | null;
    yswsEligible?: boolean;
  }
}

/** Claims returned by Hack Club Auth's userinfo endpoint. */
interface HackClubProfile {
  sub: string;
  name?: string;
  nickname?: string;
  email?: string;
  slack_id?: string;
  ysws_eligible?: boolean;
}

const HackClub: OIDCConfig<HackClubProfile> = {
  id: "hackclub",
  name: "Hack Club",
  type: "oidc",
  issuer: "https://auth.hackclub.com",
  clientId: env.AUTH_HACKCLUB_ID,
  clientSecret: env.AUTH_HACKCLUB_SECRET,
  authorization: { params: { scope: "openid profile" } },
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name ?? profile.nickname ?? null,
      email: profile.email ?? null,
      image: null,
      slackId: profile.slack_id ?? null,
      yswsEligible: profile.ysws_eligible ?? false,
    };
  },
};

export const authConfigured = Boolean(
  env.AUTH_HACKCLUB_ID && env.AUTH_HACKCLUB_SECRET,
);

export const authConfig = {
  providers: [HackClub],
  adapter: PrismaAdapter(db),
  pages: { signIn: "/", error: "/" },
  events: {
    // Keep eligibility fresh: Hack Club Auth can verify someone after their first sign-in.
    async signIn({ user, profile }) {
      if (!user.id || !profile) return;
      const p = profile as HackClubProfile;
      await db.user.update({
        where: { id: user.id },
        data: {
          slackId: p.slack_id ?? undefined,
          yswsEligible: p.ysws_eligible ?? undefined,
        },
      });
    },
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        slackId: (user as { slackId?: string | null }).slackId ?? null,
        yswsEligible:
          (user as { yswsEligible?: boolean }).yswsEligible ?? false,
      },
    }),
  },
} satisfies NextAuthConfig;
