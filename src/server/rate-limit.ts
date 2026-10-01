import "server-only";

/**
 * Fixed-window limiter held in memory. Scare runs as one process, so this is enough;
 * move to a shared store (Redis) before running several instances.
 */
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  h.count += 1;
  return { ok: h.count <= limit, retryAfter: Math.ceil((h.reset - now) / 1000) };
}

export function clientIp(headers: Headers) {
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",").pop()?.trim() ??
    "unknown"
  );
}
