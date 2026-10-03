import type { PrismaClient } from "@prisma/client";
import { getCurrentUser, resolveRole } from "@/lib/auth/session";
import { adminDiscordIds } from "@/lib/config";
import { jsonError } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";
import { getPrisma } from "@/lib/database/client";
import type { SessionUser } from "@/types";

/**
 * Server-side admin gate for API routes. Admin status is resolved from
 * `ADMIN_DISCORD_IDS` or the stored role — never from anything the client
 * sends. Returns a Response when the request must be rejected.
 */
export async function requireAdminRequest(
  request: Request,
  bucket: string,
  limit = 60,
): Promise<SessionUser | Response> {
  const limited = guardRateLimit(request, bucket, limit);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in required.", 401);

  const isAdmin =
    user.role === "ADMIN" || adminDiscordIds().includes(user.discordId ?? "");
  if (!isAdmin) return jsonError("Administrator access required.", 403);

  return { ...user, role: resolveRole(user.discordId, "ADMIN") };
}

/** Returns the Prisma client or a 503 response in demo mode. */
export function adminDatabase(): PrismaClient | Response {
  const prisma = getPrisma();
  if (!prisma) {
    return jsonError(
      "No DATABASE_URL configured — admin writes are disabled in demo mode.",
      503,
    );
  }
  return prisma;
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}

/**
 * Prisma P2025 = "record to update not found". Seed records live in code, so
 * editing one has to create a database row with the same id instead.
 */
export function isMissingRow(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2025"
  );
}
