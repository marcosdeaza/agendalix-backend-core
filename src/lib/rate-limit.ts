type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Simple in-memory fixed-window rate limiter.
 * Returns true when the request is allowed; false when the bucket is full.
 * Keys are typically "scope:identifier" (e.g. "wa:+34666111222").
 *
 * Not suitable for multi-instance deployments — use Redis for that. For Agendalix
 * we run a single Node process per container, so this is sufficient to stop spam
 * from a single phone / IP bursting the DeepSeek / 360dialog APIs.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number; remaining: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0, remaining: limit - 1 };
  }
  if (b.count < limit) {
    b.count += 1;
    return { allowed: true, retryAfterMs: 0, remaining: limit - b.count };
  }
  return { allowed: false, retryAfterMs: b.resetAt - now, remaining: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

// Periodic cleanup to keep memory bounded.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }, 60_000).unref?.();
}
