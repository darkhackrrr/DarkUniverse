import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton. The client is only constructed when a DATABASE_URL is
 * present so the app can boot (and build) without a database configured.
 */

const globalForPrisma = globalThis as unknown as {
  __prisma?: PrismaClient | undefined;
};

export function prismaAvailable(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma(): PrismaClient | null {
  if (!prismaAvailable()) return null;
  if (!globalForPrisma.__prisma) {
    globalForPrisma.__prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["warn", "error"]
          : ["error"],
    });
  }
  return globalForPrisma.__prisma;
}
