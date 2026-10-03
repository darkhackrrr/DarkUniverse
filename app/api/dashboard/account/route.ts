import { getPrisma } from "@/lib/database/client";
import { getCurrentUser, destroySession, SESSION_COOKIE } from "@/lib/auth/session";
import { jsonError, jsonOk } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

/**
 * DELETE /api/dashboard/account — removes the account and its stored data.
 * Local demo sessions have nothing server-side to delete, so we only clear
 * the local cookies in that case.
 */
export async function DELETE(request: Request) {
  const limited = guardRateLimit(request, "dashboard:delete", 5);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to manage your account.", 401);

  const prisma = getPrisma();
  if (prisma) {
    try {
      await logActivity(null, "account", `Account @${user.username} removed itself.`, {
        userId: user.id,
      });
      await prisma.user.delete({ where: { id: user.id } });
      await destroySession();
      return jsonOk({ deleted: true, storage: "database" });
    } catch {
      return jsonError("Could not delete your account.", 500);
    }
  }

  const { cookies } = await import("next/headers");
  const jar = await cookies();
  for (const name of [SESSION_COOKIE, "du_saved_tools", "du_bio", "du_demo_user"]) {
    jar.delete(name);
  }
  return jsonOk({ deleted: true, storage: "cookie" });
}
