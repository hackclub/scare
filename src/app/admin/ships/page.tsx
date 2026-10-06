import Link from "next/link";

import { PageHead } from "~/app/platform/_components/page-head";
import { formatDuration } from "~/lib/time";
import { requireAdmin } from "~/server/admin";
import { db } from "~/server/db";
import { resendAri, resyncAirtable } from "../actions";
import { type ReviewDetail } from "~/server/airtable";
import { ARI_DASHBOARD_URL, ariConfigured } from "~/server/ari";
import { env } from "~/env";
import { ActionForm } from "../_components/action-form";

export const metadata = { title: "Ships" };

const VIEWS = {
  pending: { label: "Waiting", where: { status: "SHIPPED" as const, OR: [{ reviewStatus: null }, { reviewStatus: "PENDING" as const }] } },
  approved: { label: "Approved", where: { reviewStatus: "APPROVED" as const } },
  rejected: { label: "Sent back", where: { reviewStatus: "REJECTED" as const } },
};
type View = keyof typeof VIEWS;

const safeHref = (u: string | null) => (u && /^https?:\/\//.test(u) ? u : undefined);

export default async function Ships({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireAdmin();
  const { view: raw } = await searchParams;
  const view: View = raw && raw in VIEWS ? (raw as View) : "pending";

  const games = await db.game.findMany({
    where: VIEWS[view].where,
    orderBy: view === "pending" ? { shippedAt: "asc" } : { reviewedAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, slackId: true, hcIdentityId: true, yswsEligible: true } },
      screenshot: { select: { updatedAt: true } },
    },
  });

  // Every earlier send-back, from the audit log, so a re-ship shows what it was asked to fix.
  const rejections = await db.adminAudit.findMany({
    where: { action: { in: ["ship.reject", "ship.changes"] }, targetType: "game", targetId: { in: games.map((g) => g.id) } },
    orderBy: { createdAt: "asc" },
    select: { id: true, targetId: true, createdAt: true, actorIdentity: true, detail: true },
  });
  const sentBack = new Map<string, typeof rejections>();
  for (const r of rejections) sentBack.set(r.targetId, [...(sentBack.get(r.targetId) ?? []), r]);

  return (
    <>
      <PageHead
        title="Ships"
        lead={
          <>
            Ships are reviewed in{" "}
            <a href={ARI_DASHBOARD_URL} className="link" target="_blank" rel="noreferrer noopener">
              Ari
            </a>
            . Decisions land here and in Airtable on their own; submit to Unified from Airtable.
          </>
        }
      />

      <nav className="ad-tabs" aria-label="Filter ships">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <Link key={v} href={`/admin/ships?view=${v}`} className="ad-tab" aria-current={v === view ? "page" : undefined}>
            {VIEWS[v].label}
          </Link>
        ))}
      </nav>

      {games.length === 0 ? (
        <p className="pf-empty frame">Nothing here.</p>
      ) : (
        <ul className="ad-cards">
          {games.map((g) => {
            const counted = g.claimedSeconds ?? g.trackedSeconds;
            const review = g.reviewDetail as ReviewDetail | null;
            const history = sentBack.get(g.id) ?? [];
            // Reviewed before and back in the queue: only a send-back leads there.
            const reship = g.reviewStatus !== "REJECTED" && (history.length > 0 || (view === "pending" && g.reviewedAt !== null));
            // In "Sent back", the latest rejection is the game's own note; list only the ones before it.
            const earlier = view === "rejected" ? history.slice(0, -1) : history;
            return (
              <li key={g.id} className="frame ad-card">
                <div className="frame-head">
                  <span>
                    {g.title}
                    {reship && (
                      <span className="tba ad-flag ad-reship">
                        re-ship · sent back {Math.max(history.length, 1)}×
                      </span>
                    )}
                  </span>
                  <span>
                    {g.reviewStatus === "APPROVED"
                      ? `approved · ${g.awardedPumpkins} Pumpkins`
                      : g.reviewStatus === "REJECTED"
                        ? "sent back"
                        : `shipped ${g.shippedAt?.toLocaleDateString() ?? ""}`}
                  </span>
                </div>
                <div className="ad-card-body">
                  <div className="ad-shot">
                    {g.screenshot ? (
                      // eslint-disable-next-line @next/next/no-img-element -- private, served by our own route
                      <img src={`/api/games/${g.id}/screenshot?v=${g.screenshot.updatedAt.getTime()}`} alt={`Screenshot of ${g.title}`} />
                    ) : (
                      <span className="pf-muted">No screenshot</span>
                    )}
                  </div>
                  <div className="ad-facts">
                    <p className="pf-next-text">{g.pitch}</p>
                    <dl className="ledger pf-ledger ad-ledger">
                      <div>
                        <dt>By</dt>
                        <dd>
                          <Link href={`/admin/users/${g.user.id}`} className="link">{g.user.name ?? "Unnamed"}</Link>
                          {!g.user.yswsEligible && <span className="tba ad-flag">not YSWS eligible</span>}
                        </dd>
                      </div>
                      <div><dt>Slack</dt><dd className="pf-mono">{g.user.slackId ?? "none"}</dd></div>
                      <div>
                        <dt>Play</dt>
                        <dd>{safeHref(g.playUrl) ? <a className="link" href={safeHref(g.playUrl)} target="_blank" rel="noreferrer noopener">{g.playUrl}</a> : "none"}</dd>
                      </div>
                      <div>
                        <dt>Source</dt>
                        <dd>{safeHref(g.sourceUrl) ? <a className="link" href={safeHref(g.sourceUrl)} target="_blank" rel="noreferrer noopener">{g.sourceUrl}</a> : "none"}</dd>
                      </div>
                      <div><dt>Hackatime project</dt><dd>{g.hackatimeProject ?? "none"}</dd></div>
                      <div>
                        <dt>Time</dt>
                        <dd>
                          {formatDuration(counted)}
                          {g.claimedSeconds !== null && (
                            <span className="tba ad-flag">edited · Hackatime {formatDuration(g.trackedSeconds)}</span>
                          )}
                        </dd>
                      </div>
                      {/* A pending game's note is the last send-back, shown with the others below. */}
                      {view !== "pending" && g.reviewNote && <div><dt>Note</dt><dd>{g.reviewNote}</dd></div>}
                      {earlier.length > 0 ? (
                        <div>
                          <dt>{view === "rejected" ? "Sent back before" : "Sent back"}</dt>
                          <dd>
                            <ol className="ad-history">
                              {earlier.map((r) => (
                                <li key={r.id}>
                                  <span className="pf-muted">
                                    {r.createdAt.toLocaleDateString()} · {r.actorIdentity}
                                  </span>{" "}
                                  {(r.detail as { note?: string } | null)?.note ?? ""}
                                </li>
                              ))}
                            </ol>
                          </dd>
                        </div>
                      ) : (
                        view === "pending" && g.reviewNote && <div><dt>Sent back</dt><dd>{g.reviewNote}</dd></div>
                      )}
                      <div>
                        <dt>Airtable</dt>
                        <dd>
                          {g.airtableRecordId ? (
                            <a
                              className="link"
                              href={`https://airtable.com/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_ID}/${g.airtableRecordId}`}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              {g.airtableRecordId}
                            </a>
                          ) : (
                            "not synced"
                          )}
                          {g.airtableError && <span className="tba ad-flag">sync error</span>}
                        </dd>
                      </div>
                      {g.airtableError && <div><dt>Sync error</dt><dd className="ad-error-text">{g.airtableError}</dd></div>}
                      {ariConfigured && (
                        <div>
                          <dt>Ari</dt>
                          <dd>
                            {g.ariShipId ? (
                              <a className="link pf-mono" href={ARI_DASHBOARD_URL} target="_blank" rel="noreferrer noopener" title="Open Ari">
                                {g.ariShipId}
                              </a>
                            ) : (
                              "not sent"
                            )}
                            {g.ariError && <span className="tba ad-flag">send error</span>}
                          </dd>
                        </div>
                      )}
                      {review && (
                        <div>
                          <dt>Ari review</dt>
                          <dd>
                            {review.decision === "approved"
                              ? `Approved ${g.reviewHours ?? 0}h`
                              : review.decision === "changes"
                                ? "Changes requested"
                                : "Rejected"}
                            {review.reviewer && <span className="pf-muted"> · {review.reviewer}</span>}
                          </dd>
                        </div>
                      )}
                      {review?.justification.technical_features && (
                        <div><dt>Technical</dt><dd>{review.justification.technical_features}</dd></div>
                      )}
                      {review?.justification.hours_reasoning && (
                        <div><dt>Hours reasoning</dt><dd>{review.justification.hours_reasoning}</dd></div>
                      )}
                      {g.ariError && <div><dt>Ari error</dt><dd className="ad-error-text">{g.ariError}</dd></div>}
                    </dl>
                  </div>
                </div>

                {g.status === "SHIPPED" && (
                  <div className="ad-decide ad-decide-quiet">
                    <ActionForm action={resyncAirtable} submit={g.airtableRecordId ? "Resync Airtable" : "Send to Airtable"} tone="ghost">
                      <input type="hidden" name="gameId" value={g.id} />
                    </ActionForm>
                    {ariConfigured && (
                      <ActionForm action={resendAri} submit={g.ariShipId ? "Resend to Ari" : "Send to Ari"} tone="ghost">
                        <input type="hidden" name="gameId" value={g.id} />
                      </ActionForm>
                    )}
                  </div>
                )}

              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
