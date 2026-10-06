import { getPrisma } from "@/lib/database/client";

export interface MemberProfileRecord {
  guildId: string;
  userId: string;
  xp: number;
  level: number;
  messages: number;
  rep: number;
  repAt: Date | null;
  bio: string | null;
}

export function levelFromXp(xp: number): number {
  return Math.floor(0.1 * Math.sqrt(Math.max(0, xp)));
}

export function xpForLevel(level: number): number {
  return 100 * level * level;
}

export function progressBar(percent: number, length = 10): string {
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * length);
  return "▰".repeat(filled) + "▱".repeat(length - filled);
}

export async function ensureProfile(
  guildId: string,
  userId: string,
): Promise<MemberProfileRecord | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const existing = await prisma.memberProfile.findUnique({
    where: { guildId_userId: { guildId, userId } },
  });
  if (existing) return existing;
  return prisma.memberProfile.create({ data: { guildId, userId } });
}

/** Applies XP, keeps level in sync. Returns the level-up flag. */
export async function addXp(
  guildId: string,
  userId: string,
  amount: number,
): Promise<{ leveledUp: boolean; level: number; xp: number } | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const profile = await ensureProfile(guildId, userId);
  if (!profile) return null;
  const xp = profile.xp + amount;
  const level = levelFromXp(xp);
  await prisma.memberProfile.update({
    where: { guildId_userId: { guildId, userId } },
    data: { xp, level },
  });
  return { leveledUp: level > profile.level, level, xp };
}
