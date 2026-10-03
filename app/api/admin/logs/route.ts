import { requireAdminRequest, isResponse } from "@/lib/api/admin";
import { jsonOk } from "@/lib/api/helpers";
import { getPrisma } from "@/lib/database/client";

export const runtime = "nodejs";

/**
 * GET /api/admin/logs?type=admin&limit=100 — recent activity/audit events.
 * Stored in the Activity table (type `admin` for admin actions).
 */
export async function GET(request: Request) {
  const admin = await requireAdminRequest(request, "admin:logs", 60);
  if (isResponse(admin)) return admin;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const rawLimit = Number(searchParams.get("limit") ?? 100);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 500)
    : 100;

  const prisma = getPrisma();
  if (!prisma) {
    return jsonOk({ logs: [], persistent: false });
  }

  try {
    const rows = await prisma.activity.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { username: true } } },
    });
    return jsonOk({
      logs: rows.map((row) => ({
        id: row.id,
        type: row.type,
        message: row.message,
        actor: row.user?.username ?? null,
        metadata: row.metadata,
        createdAt: row.createdAt.toISOString(),
      })),
      persistent: true,
    });
  } catch {
    return jsonOk({ logs: [], persistent: false });
  }
}
