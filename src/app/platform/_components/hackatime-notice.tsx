const MESSAGES: Record<string, { text: string; ok?: boolean }> = {
  linked: {
    text: "Hackatime is linked. Your projects are ready to pick.",
    ok: true,
  },
  denied: {
    text: "You didn't approve Scare on Hackatime, so nothing was linked.",
  },
  expired: {
    text: "That Hackatime link took too long or didn't match. Try linking again.",
  },
  failed: {
    text: "Hackatime turned down the link. Try again, and ask in Slack if it keeps happening.",
  },
  unavailable: { text: "Hackatime didn't answer. Try again in a minute." },
  taken: {
    text: "That Hackatime account is already linked to another Scare account.",
  },
  unconfigured: { text: "Hackatime linking isn't set up on this server yet." },
};

/** Result of the Hackatime link flow, from the ?hackatime= query param. */
export function HackatimeNotice({ status }: { status?: string }) {
  const m = status ? MESSAGES[status] : undefined;
  if (!m) return null;
  return (
    <p
      className={`pf-notice ${m.ok ? "pf-notice-ok" : ""}`}
      role={m.ok ? "status" : "alert"}
    >
      {m.text}
    </p>
  );
}
