/**
 * What a page shows while the server is still answering, so a click lands on something right away
 * instead of the old page sitting there. Used by the platform and admin loading routes.
 */
export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="frame pf-loading" role="status">
      <span className="pf-loading-dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
