/**
 * Server-side caching + request helpers used by the API layer.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs = 60_000): void {
  if (cache.size > 500) {
    // Drop the oldest ~20% of entries to bound memory.
    const entries = [...cache.entries()].sort(
      (a, b) => a[1].expiresAt - b[1].expiresAt,
    );
    for (let i = 0; i < Math.floor(entries.length * 0.2); i++) {
      cache.delete(entries[i][0]);
    }
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  producer: () => Promise<T>,
): Promise<T> {
  const hit = getCached<T>(key);
  if (hit !== undefined) return hit;
  const value = await producer();
  setCached(key, value, ttlMs);
  return value;
}

export function jsonError(
  message: string,
  status = 400,
  extra: Record<string, unknown> = {},
): Response {
  return Response.json({ ok: false, error: message, ...extra }, { status });
}

export function jsonOk<T>(data: T, init: ResponseInit = {}): Response {
  return Response.json({ ok: true, data }, init);
}

export function badRequest(message: string): Response {
  return jsonError(message, 400);
}

export function notFound(message: string): Response {
  return jsonError(message, 404);
}

export function serverError(message = "Something went wrong."): Response {
  return jsonError(message, 500);
}

export function tooMany(retryAfterSeconds: number): Response {
  return Response.json(
    { ok: false, error: "Too many requests. Please slow down." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
