import Link from "next/link";

import { PageHead } from "~/app/platform/_components/page-head";
import { requireAdmin } from "~/server/admin";
import { db } from "~/server/db";

export const metadata = { title: "Audit log" };

const link = (type: string, id: string) =>
  type === "user"
    ? `/admin/users/${id}`
    : type === "order"
      ? `/admin/orders`
      : type === "suggestion"
        ? `/admin/suggestions`
        : type === "game"
          ? `/admin/ships?view=approved`
          : null;

export default async function Audit() {
  await requireAdmin();
  const entries = await db.adminAudit.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <>
      <PageHead title="Audit log" lead="Every admin action, newest first. It can't be edited from here." />
      <section className="frame">
        <div className="frame-head"><span>Entries</span><span>{entries.length}{entries.length === 200 ? "+" : ""}</span></div>
        {entries.length === 0 ? <p className="pf-empty">Nothing yet.</p> : (
          <ul className="pf-list">
            {entries.map((a) => {
              const href = link(a.targetType, a.targetId);
              return (
                <li key={a.id} className="pf-list-row ad-audit-row">
                  <span className="pf-list-title pf-mono">{a.action}</span>
                  <span className="pf-list-meta">
                    {href ? <Link href={href} className="link">{a.targetType} {a.targetId.slice(-6)}</Link> : `${a.targetType} ${a.targetId.slice(-6)}`}
                  </span>
                  <span className="pf-list-meta ad-detail">{JSON.stringify(a.detail ?? {})}</span>
                  <span className="pf-list-meta pf-mono">{a.actorIdentity}</span>
                  <span className="pf-list-meta">{a.createdAt.toLocaleString()}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
