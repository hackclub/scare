import Link from "next/link";

import { PageHead } from "~/app/platform/_components/page-head";
import { requireAdmin } from "~/server/admin";
import { db } from "~/server/db";
import { fulfillOrder, rejectOrder } from "../actions";
import { ActionForm } from "../_components/action-form";

export const metadata = { title: "Orders" };

const STATUSES = ["PENDING", "FULFILLED", "REJECTED", "CANCELLED"] as const;
type Status = (typeof STATUSES)[number];
const LABEL: Record<Status, string> = { PENDING: "Pending", FULFILLED: "Fulfilled", REJECTED: "Rejected", CANCELLED: "Cancelled" };

const isUrl = (s: string | null) => Boolean(s && /^https?:\/\//.test(s));

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status: raw } = await searchParams;
  const status: Status = (STATUSES as readonly string[]).includes(raw ?? "") ? (raw as Status) : "PENDING";

  const orders = await db.order.findMany({
    where: { status },
    orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
    take: 200,
    include: { user: { select: { id: true, name: true, slackId: true, pumpkins: true } } },
  });

  return (
    <>
      <PageHead
        title="Orders"
        lead="Fulfill an order once it's sent. Rejecting a pending order refunds its Pumpkins."
      />
      <nav className="ad-tabs" aria-label="Filter orders">
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className="ad-tab" aria-current={s === status ? "page" : undefined}>
            {LABEL[s]}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="pf-empty frame">Nothing here.</p>
      ) : (
        <ul className="ad-cards">
          {orders.map((o) => (
            <li key={o.id} className="frame ad-card">
              <div className="frame-head">
                <span>{o.itemName}</span>
                <span>
                  {o.pumpkins} Pumpkins · ${o.usd.toFixed(2)} · {o.createdAt.toLocaleDateString()}
                </span>
              </div>
              <dl className="ledger pf-ledger ad-ledger">
                <div>
                  <dt>For</dt>
                  <dd>
                    <Link href={`/admin/users/${o.user.id}`} className="link">{o.user.name ?? "Unnamed"}</Link>
                  </dd>
                </div>
                <div><dt>Slack</dt><dd className="pf-mono">{o.user.slackId ?? "none"}</dd></div>
                <div>
                  <dt>Details</dt>
                  <dd>
                    {o.details ? (
                      isUrl(o.details) ? (
                        <a href={o.details} className="link" target="_blank" rel="noreferrer noopener">{o.details}</a>
                      ) : (
                        o.details
                      )
                    ) : (
                      "none"
                    )}
                  </dd>
                </div>
                {o.adminNote && <div><dt>Note</dt><dd>{o.adminNote}</dd></div>}
                {o.handledBy && <div><dt>Handled by</dt><dd className="pf-mono">{o.handledBy}</dd></div>}
              </dl>
              {o.status === "PENDING" && (
                <div className="ad-decide">
                  <ActionForm action={fulfillOrder} submit="Mark fulfilled">
                    <input type="hidden" name="orderId" value={o.id} />
                    <label className="field">
                      <span className="field-label">Note<span className="field-hint">optional, e.g. a tracking number</span></span>
                      <input name="note" className="input" maxLength={1000} />
                    </label>
                  </ActionForm>
                  <ActionForm action={rejectOrder} submit="Reject and refund" tone="danger">
                    <input type="hidden" name="orderId" value={o.id} />
                    <label className="field">
                      <span className="field-label">Why</span>
                      <input name="note" className="input" maxLength={1000} required />
                    </label>
                  </ActionForm>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
