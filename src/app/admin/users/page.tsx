import Link from "next/link";

import { PageHead } from "~/app/platform/_components/page-head";
import { requireAdmin } from "~/server/admin";
import { db } from "~/server/db";

export const metadata = { title: "Users" };

export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);

  const users = await db.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { slackId: { contains: q, mode: "insensitive" } },
            { hcIdentityId: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      slackId: true,
      pumpkins: true,
      verificationStatus: true,
      _count: { select: { games: true, orders: true } },
    },
  });

  return (
    <>
      <PageHead title="Users" lead="Find someone by name, email, Slack ID or Hack Club identity." />
      <form className="ad-search" role="search">
        <label htmlFor="ad-q" className="sr-only">Search users</label>
        <input id="ad-q" name="q" defaultValue={q} className="input" placeholder="Search" />
        <button type="submit" className="btn btn-ghost">Search</button>
      </form>

      <section className="frame">
        <div className="frame-head">
          <span>{q ? `Matching "${q}"` : "Everyone"}</span>
          <span>{users.length}{users.length === 100 ? "+" : ""}</span>
        </div>
        {users.length === 0 ? (
          <p className="pf-empty">No one matches that.</p>
        ) : (
          <ul className="pf-list">
            {users.map((u) => (
              <li key={u.id} className="pf-list-row ad-user-row">
                <Link href={`/admin/users/${u.id}`} className="pf-list-title link">{u.name ?? "Unnamed"}</Link>
                <span className="pf-list-meta">{u.email ?? u.slackId ?? ""}</span>
                <span className="pf-list-meta">{u._count.games} games · {u._count.orders} orders</span>
                <span className="pf-list-meta ad-num-cell">{u.pumpkins} P</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
