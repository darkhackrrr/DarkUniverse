import { rateLimit, clientIp } from "@/lib/rate-limit";
import { tooMany, jsonError } from "@/lib/api/helpers";

/**
 * Applies per-IP rate limiting to a route handler.
 * Returns null when the request may proceed.
 */
export function guardRateLimit(
  request: Request,
  bucket: string,
  limit = 60,
): Response | null {
  const ip = clientIp(request);
  const result = rateLimit(`${bucket}:${ip}`, limit);
  if (!result.success) return tooMany(result.retryAfterSeconds);
  return null;
}

/** Validates that a request carries a JSON content type. */
export async function readJson(request: Request): Promise<
  { body: unknown } | { error: Response }
> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return { error: jsonError("Expected a JSON request body.", 415) };
  }
  try {
    const body = await request.json();
    return { body };
  } catch {
    return { error: jsonError("Invalid JSON body.", 400) };
  }
}
