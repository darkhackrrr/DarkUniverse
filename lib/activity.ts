import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/database/client";

/**
 * Records a user activity event. Failures are swallowed — logging must never
 * break a request. Returns false when no database is configured.
 */
export async function logActivity(
  userId: string | null,
  type: string,
  message: string,
  metadata?: Record<string, unknown>,
): Promise<boolean> {
  const prisma = getPrisma();
  if (!prisma) return false;
  try {
    await prisma.activity.create({
      data: {
        userId,
        type,
        message,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
    return true;
  } catch {
    return false;
  }
}
