import "~/styles/platform.css";
import "~/styles/admin.css";

import { type Metadata } from "next";
import Link from "next/link";

import { PumpkinMark } from "~/app/_components/icons";
import { SilenceAmbience } from "~/app/_components/silence-ambience";
import { requireAdmin } from "~/server/admin";
import { db } from "~/server/db";
import { AdminNav } from "./_components/admin-nav";

export const metadata: Metadata = {
  title: { default: "Admin | Scare", template: "%s | Scare admin" },
  robots: { index: false, follow: false, nocache: true },
};
// Never cached or prerendered: every request re-checks who's asking.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  const [ships, orders, suggestions] = await Promise.all([
    db.game.count({ where: { status: "SHIPPED", OR: [{ reviewStatus: null }, { reviewStatus: "PENDING" }] } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.suggestion.count({ where: { status: "NEW" } }),
  ]);

  return (
    <div className="pf">
      <SilenceAmbience />
      <aside className="pf-rail">
        <Link href="/admin" className="pf-brand" aria-label="Admin overview">
          <PumpkinMark className="pf-brand-pumpkin" />
          <span className="pf-brand-word">SCARE</span>
          <span className="pf-brand-tag ad-tag">admin</span>
        </Link>
        <AdminNav counts={{ ships, orders, suggestions }} />
        <div className="pf-rail-foot">
          <p className="ad-who">
            Signed in as <span className="pf-mono">{admin.identity}</span>
          </p>
          <Link href="/platform" className="btn btn-ghost ad-back">
            Back to the platform
          </Link>
        </div>
      </aside>
      <div className="pf-main">
        <main id="main" className="pf-content ad-content">
          {children}
        </main>
      </div>
    </div>
  );
}
