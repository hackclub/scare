/**
 * node-postgres reads `sslrootcert` as a file path, so libpq's `sslrootcert=system` would look for a
 * file named "system". Dropping it leaves `sslmode=verify-full` checking against Node's bundled CAs.
 */
export function pgConnectionString(url: string) {
  const parsed = new URL(url);
  if (parsed.searchParams.get("sslrootcert") === "system") {
    parsed.searchParams.delete("sslrootcert");
  }
  return parsed.toString();
}
