const LABELS: Record<
  string,
  { label: string; short: string; tone: "ok" | "wait" | "warn" }
> = {
  verified: { label: "Verified", short: "Verified", tone: "ok" },
  pending: { label: "Verification pending", short: "Pending", tone: "wait" },
  needs_submission: {
    label: "Not verified yet",
    short: "Not yet",
    tone: "warn",
  },
  ineligible: { label: "Ineligible", short: "Ineligible", tone: "warn" },
};

export function verificationLabel(status: string | null) {
  return (
    LABELS[status ?? ""] ?? {
      label: "Status unknown",
      short: "Unknown",
      tone: "warn" as const,
    }
  );
}

export function VerificationBadge({ status }: { status: string | null }) {
  const v = verificationLabel(status);
  return (
    <p className={`pf-badge pf-badge-${v.tone}`}>
      <span className="pf-badge-dot" aria-hidden="true" />
      {v.label}
    </p>
  );
}
