import { getPrisma } from "@/lib/database/client";
import type { Prisma, GuildConfig } from "@prisma/client";

export interface ReactionRoleEntry {
  channelId: string;
  messageId: string;
  emoji: string;
  roleId: string;
}

const CACHE_TTL_MS = 10_000;
const cache = new Map<string, { value: GuildConfig; expiresAt: number }>();

export function invalidateConfig(guildId: string): void {
  cache.delete(guildId);
}

export async function getConfig(guildId: string): Promise<GuildConfig | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const hit = cache.get(guildId);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  let config = await prisma.guildConfig.findUnique({ where: { guildId } });
  if (!config) config = await prisma.guildConfig.create({ data: { guildId } });
  cache.set(guildId, { value: config, expiresAt: Date.now() + CACHE_TTL_MS });
  return config;
}

export async function patchConfig(
  guildId: string,
  data: Prisma.GuildConfigUncheckedUpdateInput,
): Promise<GuildConfig | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const config = await prisma.guildConfig.upsert({
    where: { guildId },
    create: { ...(data as Prisma.GuildConfigUncheckedCreateInput), guildId },
    update: data,
  });
  invalidateConfig(guildId);
  return config;
}

export async function getReactionRoles(
  guildId: string,
): Promise<ReactionRoleEntry[]> {
  const config = await getConfig(guildId);
  if (!config?.reactionRoles) return [];
  try {
    const parsed = JSON.parse(String(config.reactionRoles)) as unknown;
    return Array.isArray(parsed) ? (parsed as ReactionRoleEntry[]) : [];
  } catch {
    return [];
  }
}

export async function setReactionRoles(
  guildId: string,
  entries: ReactionRoleEntry[],
): Promise<void> {
  await patchConfig(guildId, { reactionRoles: JSON.stringify(entries) });
}

export function renderTemplate(
  template: string,
  vars: { user: string; server: string; memberCount: number },
): string {
  return template
    .replaceAll("{user}", vars.user)
    .replaceAll("{server}", vars.server)
    .replaceAll("{memberCount}", String(vars.memberCount));
}
