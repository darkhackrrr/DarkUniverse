import { searchAll } from "@/lib/search";
import { badRequest, jsonOk } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";

export const runtime = "nodejs";

/**
 * GET /api/search?q=nebula&limit=20
 * Global search across tools, games, codes, resources and announcements.
 */
export async function GET(request: Request) {
  const limited = guardRateLimit(request, "search", 60);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return badRequest("Query parameter q is required.");

  const rawLimit = Number(searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 50)
    : 20;

  const results = await searchAll(q, limit);
  return jsonOk({ query: q, count: results.length, results });
}
