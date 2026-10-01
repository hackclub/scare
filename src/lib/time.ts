/** "12h 04m", or "35m" under an hour. */
export function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

/** Hours to one decimal, for the editable field. */
export const toHours = (seconds: number) => Math.round((seconds / 3600) * 10) / 10;
