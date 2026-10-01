"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ArrowUpRight } from "~/app/_components/icons";
import { api } from "~/trpc/react";

interface Link {
  slackId: string | null;
  githubUsername: string | null;
  createdAt: Date;
}

/** The Hackatime row on Profile: link, or show what's linked and let them unlink. */
export function HackatimePanel({
  link,
  configured,
  slackMatches,
  settingsUrl,
}: {
  link: Link | null;
  configured: boolean;
  slackMatches: boolean | null;
  settingsUrl: string;
}) {
  const router = useRouter();
  const utils = api.useUtils();
  const [confirm, setConfirm] = useState(false);
  const unlink = api.hackatime.unlink.useMutation({
    onSuccess: async () => {
      await utils.hackatime.invalidate();
      setConfirm(false);
      router.refresh();
    },
  });

  if (!link) {
    return (
      <div className="pf-next-body pf-session">
        <p className="pf-next-text">
          {configured
            ? "Link Hackatime to pull coding time from your projects when you register a game."
            : "Hackatime linking isn't set up on this server yet."}
        </p>
        {configured && (
          <a href="/api/hackatime/connect?next=/platform/profile" className="btn btn-primary">
            <span>Link Hackatime</span>
            <ArrowUpRight className="btn-icon" />
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      <dl className="ledger pf-ledger">
        <div>
          <dt>GitHub</dt>
          <dd className="pf-mono">{link.githubUsername ?? <span className="pf-muted">Not on Hackatime</span>}</dd>
        </div>
        <div>
          <dt>Slack ID</dt>
          <dd className="pf-mono">{link.slackId ?? <span className="pf-muted">Not on Hackatime</span>}</dd>
        </div>
        <div>
          <dt>Linked</dt>
          <dd>{new Date(link.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</dd>
        </div>
      </dl>
      {slackMatches === false && (
        <p className="pf-notice pf-notice-inset" role="alert">
          This Hackatime account has a different Slack ID than your Hack Club account. Make sure
          it&rsquo;s yours.
        </p>
      )}
      <div className={`pf-next-body pf-session ${confirm ? "pf-session-confirming" : ""}`}>
        <p className="pf-next-text">
          Scare reads your Hackatime projects and their time. You can also revoke it from{" "}
          <a href={settingsUrl} className="link">
            Hackatime&rsquo;s settings
          </a>
          .
        </p>
        {confirm ? (
          <div className="pf-confirm" role="group" aria-label="Confirm unlinking Hackatime">
            <p className="pf-confirm-text">
              Unlink Hackatime? Projects already using its time keep it, but you won&rsquo;t be
              able to pick Hackatime projects until you link it again.
            </p>
            <div className="pf-confirm-actions">
              <button
                type="button"
                className="btn btn-ghost pf-confirm-yes"
                onClick={() => unlink.mutate()}
                disabled={unlink.isPending}
              >
                {unlink.isPending ? "Unlinking…" : "Yes, unlink"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)} autoFocus>
                Keep it
              </button>
            </div>
            {unlink.error && (
              <p className="form-error" role="alert">
                That didn&rsquo;t work. Try again in a moment.
              </p>
            )}
          </div>
        ) : (
          <button type="button" className="btn btn-ghost" onClick={() => setConfirm(true)}>
            Unlink
          </button>
        )}
      </div>
    </>
  );
}
