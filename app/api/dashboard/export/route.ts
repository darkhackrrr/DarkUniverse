import { getCurrentUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/dashboard";
import { jsonError, jsonOk } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";
import { siteConfig } from "@/lib/config";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/export — downloads everything we store for the signed-in
 * profile as JSON (profile, saved tools, badges, rewards, activity).
 */
export async function GET(request: Request) {
  const limited = guardRateLimit(request, "dashboard:export", 10);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to export your data.", 401);

  const data = await getDashboardData(user);
  const { iat: _iat, exp: _exp, ...safeUser } = { ...user } as Record<string, unknown>;

  return jsonOk(
    {
      exportedAt: new Date().toISOString(),
      source: siteConfig.name,
      user: safeUser,
      savedTools: data.savedTools,
      badges: data.badgeStates,
      rewards: data.rewardStates,
      points: data.points,
      activity: data.activity,
      storage: data.databaseBacked ? "database" : "cookie",
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="darkuniverse-data-${user.username}.json"`,
      },
    },
  );
}
