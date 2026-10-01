import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import { type OAuthConfig } from "next-auth/providers";
import { type Adapter } from "next-auth/adapters";

import { env } from "~/env";
import { encryptOpt } from "~/server/crypto";
import { db } from "~/server/db";
import {
  HACKCLUB_AUTH,
  HACKCLUB_SCOPES,
  displayName,
  storedFields,
  type HackClubMe,
} from "~/server/hackclub";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      slackId: string | null;
      yswsEligible: boolean;
      verificationStatus: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    hcIdentityId?: string | null;
    slackId?: string | null;
    yswsEligible?: boolean;
    verificationStatus?: string | null;
  }
}

/** Hack Club Auth over plain OAuth 2.0; identity comes from GET /api/v1/me. */
const HackClub: OAuthConfig<HackClubMe> = {
  id: "hackclub",
  name: "Hack Club",
  type: "oauth",
  clientId: env.AUTH_HACKCLUB_ID,
  clientSecret: env.AUTH_HACKCLUB_SECRET,
  authorization: {
    url: HACKCLUB_AUTH.authorize,
    params: { scope: HACKCLUB_SCOPES },
  },
  token: HACKCLUB_AUTH.token,
  userinfo: HACKCLUB_AUTH.me,
  // The guide sends client credentials in the token request body.
  client: { token_endpoint_auth_method: "client_secret_post" },
  checks: ["pkce", "state"],
  profile(me) {
    const i = me.identity;
    return {
      id: i.id,
      name: displayName(i),
      email: i.primary_email ?? null,
      image: null,
      hcIdentityId: i.id,
      slackId: i.slack_id ?? null,
      yswsEligible: i.ysws_eligible ?? false,
      verificationStatus: i.verification_status ?? null,
    };
  },
};

export const authConfigured = Boolean(
  env.AUTH_HACKCLUB_ID && env.AUTH_HACKCLUB_SECRET,
);

/** Stores OAuth tokens encrypted at rest. */
const baseAdapter = PrismaAdapter(db);
const adapter: Adapter = {
  ...baseAdapter,
  linkAccount: (account) =>
    baseAdapter.linkAccount!({
      ...account,
      access_token: encryptOpt(account.access_token),
      refresh_token: encryptOpt(account.refresh_token),
      id_token: encryptOpt(account.id_token),
    }),
};

export const authConfig = {
  providers: [HackClub],
  adapter,
  // Shorter-lived sessions, refreshed daily while in use.
  session: { strategy: "database", maxAge: 7 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  events: {
    // Verification can change between sign-ins, so refresh what Scare keeps every time.
    async signIn({ user, profile }) {
      if (!user.id || !profile) return;
      const me = profile as unknown as HackClubMe;
      if (!me.identity) return;
      await db.user.update({ where: { id: user.id }, data: storedFields(me) });
    },
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        slackId: user.slackId ?? null,
        yswsEligible: user.yswsEligible ?? false,
        verificationStatus: user.verificationStatus ?? null,
      },
    }),
  },
} satisfies NextAuthConfig;
