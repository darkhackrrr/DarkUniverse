/**
 * Lightweight in-memory sliding-window rate limiter for public API routes.
 *
 * Suitable for a single serverless instance. For multi-region deployments
 * swap this out for a shared store (Redis / Upstash) with the same interface.
 */

interface Bucket {
  hits: number[];
}

const store = new Map<string, Bucket>();
const GLOBAL_TTL_MS = 60_000;

// Periodically drop stale buckets so the map cannot grow unbounded.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < GLOBAL_TTL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (bucket.hits.length === 0 || bucket.hits[0] < now - GLOBAL_TTL_MS) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit = Number(process.env.RATE_LIMIT_MAX ?? 60),
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > now - windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now;
    store.set(key, bucket);
    return {
      success: false,
      remaining: 0,
      limit,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.hits.push(now);
  store.set(key, bucket);
  return {
    success: true,
    remaining: limit - bucket.hits.length,
    limit,
    retryAfterSeconds: 0,
  };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
