const RAMP = ".:-=+*#%@";

/** Page title with a density rule under it: sparse on the left, dense on the right. */
export function PageHead({
  title,
  lead,
  actions,
}: {
  title: string;
  lead?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const rule = RAMP.split("")
    .map((c) => c.repeat(12))
    .join("");

  return (
    <header className="pf-head">
      <div className="pf-head-row">
        <h1 className="pf-title">{title}</h1>
        {actions && <div className="pf-head-actions">{actions}</div>}
      </div>
      <p className="pf-rule" aria-hidden="true">
        {rule}
      </p>
      {lead && <p className="pf-lead">{lead}</p>}
    </header>
  );
}
