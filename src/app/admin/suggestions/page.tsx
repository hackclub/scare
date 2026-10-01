import Link from "next/link";

import { PageHead } from "~/app/platform/_components/page-head";
import { requireAdmin } from "~/server/admin";
import { db } from "~/server/db";
import { addSuggestion, declineSuggestion } from "../actions";
import { ActionForm } from "../_components/action-form";

export const metadata = { title: "Suggestions" };

const STATUSES = ["NEW", "ADDED", "DECLINED"] as const;
type Status = (typeof STATUSES)[number];
const LABEL: Record<Status, string> = { NEW: "New", ADDED: "Added", DECLINED: "Declined" };

/** Same item, different typing: "Steam Deck", "steam deck " and "Steam  Deck" count together. */
const key = (name: string) => name.toLowerCase().replace(/\s+/g, " ").trim();

export default async function Suggestions({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status: raw } = await searchParams;
  const status: Status = (STATUSES as readonly string[]).includes(raw ?? "") ? (raw as Status) : "NEW";

  const suggestions = await db.suggestion.findMany({
    where: { status },
    orderBy: { createdAt: status === "NEW" ? "asc" : "desc" },
    take: 300,
    include: { user: { select: { id: true, name: true, slackId: true } } },
  });

  // How many people asked for the same thing; new ones sort by demand, then oldest first.
  const asks = new Map<string, number>();
  for (const s of suggestions) asks.set(key(s.name), (asks.get(key(s.name)) ?? 0) + 1);
  if (status === "NEW") suggestions.sort((a, b) => (asks.get(key(b.name)) ?? 0) - (asks.get(key(a.name)) ?? 0));

  return (
    <>
      <PageHead
        title="Suggestions"
        lead="Items people want in the shop. Add one to the catalog, then mark it added so they see it made it in."
      />
      <nav className="ad-tabs" aria-label="Filter suggestions">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/suggestions?status=${s}`}
            className="ad-tab"
            aria-current={s === status ? "page" : undefined}
          >
            {LABEL[s]}
          </Link>
        ))}
      </nav>

      {suggestions.length === 0 ? (
        <p className="pf-empty frame">Nothing here.</p>
      ) : (
        <ul className="ad-cards">
          {suggestions.map((s) => {
            const n = asks.get(key(s.name)) ?? 1;
            return (
              <li key={s.id} className="frame ad-card">
                <div className="frame-head">
                  <span>{s.name}</span>
                  <span>
                    {n > 1 && <>{n} people asked · </>}
                    {s.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <dl className="ledger pf-ledger ad-ledger">
                  <div>
                    <dt>From</dt>
                    <dd>
                      <Link href={`/admin/users/${s.user.id}`} className="link">
                        {s.user.name ?? "Unnamed"}
                      </Link>
                    </dd>
                  </div>
                  <div><dt>Slack</dt><dd className="pf-mono">{s.user.slackId ?? "none"}</dd></div>
                  <div>
                    <dt>Link</dt>
                    <dd>
                      {s.link ? (
                        <a href={s.link} className="link" target="_blank" rel="noreferrer noopener">
                          {s.link}
                        </a>
                      ) : (
                        "none"
                      )}
                    </dd>
                  </div>
                  <div><dt>Why</dt><dd>{s.why ?? "none"}</dd></div>
                  {s.adminNote && <div><dt>Note</dt><dd>{s.adminNote}</dd></div>}
                  {s.handledBy && <div><dt>Handled by</dt><dd className="pf-mono">{s.handledBy}</dd></div>}
                </dl>
                {s.status === "NEW" && (
                  <div className="ad-decide">
                    <ActionForm action={addSuggestion} submit="Mark added">
                      <input type="hidden" name="suggestionId" value={s.id} />
                      <label className="field">
                        <span className="field-label">Note<span className="field-hint">optional, they see this</span></span>
                        <input name="note" className="input" maxLength={1000} />
                      </label>
                    </ActionForm>
                    <ActionForm action={declineSuggestion} submit="Decline" tone="danger">
                      <input type="hidden" name="suggestionId" value={s.id} />
                      <label className="field">
                        <span className="field-label">Note<span className="field-hint">optional, they see this</span></span>
                        <input name="note" className="input" maxLength={1000} placeholder="Too pricey for the program" />
                      </label>
                    </ActionForm>
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
