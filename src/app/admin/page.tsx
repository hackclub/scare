import Link from "next/link";

import { PageHead } from "~/app/platform/_components/page-head";
import { requireAdmin } from "~/server/admin";
import { db } from "~/server/db";

export const metadata = { title: "Overview" };

export default async function AdminOverview() {
  await requireAdmin();

  const [users, onboarded, linked, brewing, shippedPending, approved, rejected, pendingOrders, balances, awarded, recent] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { onboardedAt: { not: null } } }),
      db.hackatimeLink.count(),
      db.game.count({ where: { status: "BREWING" } }),
      db.game.count({ where: { status: "SHIPPED", OR: [{ reviewStatus: null }, { reviewStatus: "PENDING" }] } }),
      db.game.count({ where: { reviewStatus: "APPROVED" } }),
      db.game.count({ where: { reviewStatus: "REJECTED" } }),
      db.order.count({ where: { status: "PENDING" } }),
      db.user.aggregate({ _sum: { pumpkins: true } }),
      db.game.aggregate({ _sum: { awardedPumpkins: true } }),
      db.adminAudit.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    ]);

  return (
    <>
      <PageHead title="Admin" lead="Everything that needs a person: ship reviews, orders, balances." />

      <div className="ad-grid">
        <section className="frame" aria-labelledby="todo-title">
          <div className="frame-head">
            <span id="todo-title">Needs you</span>
          </div>
          <ul className="pf-list">
            <li className="pf-list-row ad-todo">
              <span className="pf-list-title">Ships waiting for review</span>
              <span className="ad-big">{shippedPending}</span>
              <Link href="/admin/ships" className="pf-head-link">Review</Link>
            </li>
            <li className="pf-list-row ad-todo">
              <span className="pf-list-title">Orders to fulfill</span>
              <span className="ad-big">{pendingOrders}</span>
              <Link href="/admin/orders" className="pf-head-link">Open</Link>
            </li>
          </ul>
        </section>

        <section className="frame" aria-labelledby="numbers-title">
          <div className="frame-head">
            <span id="numbers-title">Numbers</span>
          </div>
          <dl className="ledger pf-ledger">
            <div><dt>Users</dt><dd>{users}</dd></div>
            <div><dt>Finished onboarding</dt><dd>{onboarded}</dd></div>
            <div><dt>Hackatime linked</dt><dd>{linked}</dd></div>
            <div><dt>Games brewing</dt><dd>{brewing}</dd></div>
            <div><dt>Ships approved</dt><dd>{approved}</dd></div>
            <div><dt>Ships sent back</dt><dd>{rejected}</dd></div>
            <div><dt>Pumpkins awarded</dt><dd>{(awarded._sum.awardedPumpkins ?? 0).toLocaleString()}</dd></div>
            <div><dt>Pumpkins held by users</dt><dd>{(balances._sum.pumpkins ?? 0).toLocaleString()}</dd></div>
          </dl>
        </section>

        <section className="frame ad-span" aria-labelledby="recent-title">
          <div className="frame-head">
            <span id="recent-title">Recent admin actions</span>
            <Link href="/admin/audit" className="pf-head-link">Audit log</Link>
          </div>
          {recent.length === 0 ? (
            <p className="pf-empty">Nothing yet.</p>
          ) : (
            <ul className="pf-list">
              {recent.map((a) => (
                <li key={a.id} className="pf-list-row">
                  <span className="pf-list-title pf-mono">{a.action}</span>
                  <span className="pf-list-meta">{a.actorIdentity}</span>
                  <span className="pf-list-meta">{a.createdAt.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
