import "~/styles/platform.css";
import "~/styles/admin.css";

import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "~/app/_components/auth-buttons";
import { Countdown } from "~/app/_components/countdown";
import { SiteFooter } from "~/app/_components/site-footer";
import { PumpkinPlain } from "~/app/_components/icons";
import { SilenceAmbience } from "~/app/_components/silence-ambience";
import { getAdmin } from "~/server/admin";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getPlatformUser } from "~/server/user";
import { TRPCReactProvider } from "~/trpc/react";
import { BrandMenu } from "./_components/brand-menu";
import { PlatformNav } from "./_components/platform-nav";
import { Who } from "./_components/who";

export const metadata: Metadata = {
  title: { default: "Platform | Scare", template: "%s | Scare" },
};

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [user, gameCount, admin] = await Promise.all([
    getPlatformUser(session.user.id),
    db.game.count({ where: { userId: session.user.id } }),
    getAdmin(),
  ]);

  // First visit: the Keeper wants a word before the platform opens.
  if (user && !user.onboardedAt) redirect("/welcome");

  return (
    <TRPCReactProvider>
      <div className="pf">
        <SilenceAmbience />
        <aside className="pf-rail">
          <BrandMenu />

          <PlatformNav
            counts={{
              projects: String(gameCount),
            }}
          />

          <div className="pf-rail-foot">
            <Who name={user?.name ?? session.user.name ?? null} />
            {admin && (
              <Link href="/admin" className="btn btn-ghost pf-admin-link">
                Admin
              </Link>
            )}
            <SignOutButton variant="ghost" className="pf-signout" />
          </div>
        </aside>

        <div className="pf-main">
          <div className="pf-bar">
            <Link
              href="/platform/shop"
              className="pf-readout pf-readout-link"
              aria-label={`${(user?.pumpkins ?? 0).toLocaleString()} Pumpkins. Open the shop`}
            >
              <PumpkinPlain className="pf-readout-icon" />
              <span className="pf-readout-value">{(user?.pumpkins ?? 0).toLocaleString()}</span>
              <span className="pf-readout-label pf-readout-unit">Pumpkins</span>
            </Link>
            <p className="pf-readout">
              <Countdown variant="readout" />
            </p>
          </div>
          <main id="main" className="pf-content">
            {children}
          </main>
          <SiteFooter />
        </div>
      </div>
    </TRPCReactProvider>
  );
}
