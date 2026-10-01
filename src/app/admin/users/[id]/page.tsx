import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHead } from "~/app/platform/_components/page-head";
import { verificationLabel } from "~/app/platform/_components/verification";
import { formatDuration } from "~/lib/time";
import { isAdminIdentity, requireAdmin } from "~/server/admin";
import { db } from "~/server/db";
import { adjustPumpkins, resetOnboarding } from "../../actions";
import { ActionForm } from "../../_components/action-form";

export const metadata = { title: "User" };

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (id.length > 40) notFound();

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      slackId: true,
      hcIdentityId: true,
      verificationStatus: true,
      yswsEligible: true,
      pumpkins: true,
      onboardedAt: true,
      hackatime: { select: { githubUsername: true, slackId: true, trustLevel: true } },
      games: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, reviewStatus: true, awardedPumpkins: true, claimedSeconds: true, trackedSeconds: true },
      },
      orders: { orderBy: { createdAt: "desc" }, select: { id: true, itemName: true, pumpkins: true, status: true, createdAt: true } },
    },
  });
  if (!user) notFound();
  const history = await db.adminAudit.findMany({
    where: { targetType: "user", targetId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <>
      <PageHead
        title={user.name ?? "Unnamed"}
        lead={isAdminIdentity(user.hcIdentityId) ? "This person is an admin." : undefined}
        actions={<Link href="/admin/users" className="btn btn-ghost">All users</Link>}
      />

      <div className="ad-grid">
        <section className="frame">
          <div className="frame-head"><span>Account</span></div>
          <dl className="ledger pf-ledger">
            <div><dt>Email</dt><dd>{user.email ?? "none"}</dd></div>
            <div><dt>Slack</dt><dd className="pf-mono">{user.slackId ?? "none"}</dd></div>
            <div><dt>Identity</dt><dd className="pf-mono">{user.hcIdentityId ?? "none"}</dd></div>
            <div><dt>Verification</dt><dd>{verificationLabel(user.verificationStatus).label}</dd></div>
            <div><dt>YSWS eligible</dt><dd>{user.yswsEligible ? "Yes" : "No"}</dd></div>
            <div><dt>Onboarding</dt><dd>{user.onboardedAt ? `done ${user.onboardedAt.toLocaleDateString()}` : "not done"}</dd></div>
            <div>
              <dt>Hackatime</dt>
              <dd>
                {user.hackatime
                  ? `${user.hackatime.githubUsername ?? "linked"} · trust ${user.hackatime.trustLevel ?? "?"}${
                      user.hackatime.slackId && user.slackId && user.hackatime.slackId !== user.slackId ? " · Slack ID differs!" : ""
                    }`
                  : "not linked"}
              </dd>
            </div>
          </dl>
          <div className="ad-decide">
            <ActionForm action={resetOnboarding} submit="Reset onboarding" tone="ghost">
              <input type="hidden" name="userId" value={user.id} />
            </ActionForm>
          </div>
        </section>

        <section className="frame">
          <div className="frame-head"><span>Pumpkins</span><span>balance {user.pumpkins}</span></div>
          <div className="ad-decide">
            <ActionForm action={adjustPumpkins} submit="Apply">
              <input type="hidden" name="userId" value={user.id} />
              <label className="field">
                <span className="field-label">Change<span className="field-hint">use a minus sign to remove</span></span>
                <input name="delta" type="number" step={1} className="input ad-num" required />
              </label>
              <label className="field">
                <span className="field-label">Reason<span className="field-hint">goes in the audit log</span></span>
                <input name="reason" className="input" maxLength={500} required />
              </label>
            </ActionForm>
          </div>
        </section>

        <section className="frame">
          <div className="frame-head"><span>Games</span><span>{user.games.length}</span></div>
          {user.games.length === 0 ? <p className="pf-empty">None.</p> : (
            <ul className="pf-list">
              {user.games.map((g) => (
                <li key={g.id} className="pf-list-row">
                  <span className="pf-list-title">{g.title}</span>
                  <span className="pf-list-meta">{formatDuration(g.claimedSeconds ?? g.trackedSeconds)}</span>
                  <span className="pf-list-meta">
                    {g.reviewStatus === "APPROVED" ? `approved +${g.awardedPumpkins}` : g.reviewStatus === "REJECTED" ? "sent back" : g.status === "SHIPPED" ? "in review" : "brewing"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="frame">
          <div className="frame-head"><span>Orders</span><span>{user.orders.length}</span></div>
          {user.orders.length === 0 ? <p className="pf-empty">None.</p> : (
            <ul className="pf-list">
              {user.orders.map((o) => (
                <li key={o.id} className="pf-list-row">
                  <span className="pf-list-title">{o.itemName}</span>
                  <span className="pf-list-meta">{o.pumpkins} P</span>
                  <span className="pf-list-meta">{o.status.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="frame ad-span">
          <div className="frame-head"><span>Admin history</span></div>
          {history.length === 0 ? <p className="pf-empty">No admin actions on this account.</p> : (
            <ul className="pf-list">
              {history.map((a) => (
                <li key={a.id} className="pf-list-row">
                  <span className="pf-list-title pf-mono">{a.action}</span>
                  <span className="pf-list-meta">{JSON.stringify(a.detail ?? {})}</span>
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
