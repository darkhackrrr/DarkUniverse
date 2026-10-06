import {
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
  type Guild,
  type GuildMember,
  type User,
} from "discord.js";
import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/database/client";

const PERMISSION_LABELS = new Map<bigint, string>([
  [PermissionFlagsBits.BanMembers, "Ban Members"],
  [PermissionFlagsBits.KickMembers, "Kick Members"],
  [PermissionFlagsBits.ModerateMembers, "Timeout Members"],
  [PermissionFlagsBits.ManageMessages, "Manage Messages"],
  [PermissionFlagsBits.ManageChannels, "Manage Channels"],
  [PermissionFlagsBits.ManageRoles, "Manage Roles"],
  [PermissionFlagsBits.ManageGuild, "Manage Server"],
  [PermissionFlagsBits.ManageNicknames, "Manage Nicknames"],
  [PermissionFlagsBits.Administrator, "Administrator"],
]);

/** Runtime permission check (slash default perms are only a UI hint). */
export async function requirePermission(
  interaction: ChatInputCommandInteraction,
  permission: bigint,
): Promise<boolean> {
  const has = interaction.inGuild() && interaction.memberPermissions?.has(permission);
  if (!has) {
    await interaction.reply({
      content: `You need the **${PERMISSION_LABELS.get(permission) ?? "required"}** permission to use this command.`,
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  return true;
}

/** True when the bot itself lacks the permission for the action. */
export function botLacks(
  interaction: ChatInputCommandInteraction,
  permission: bigint,
): boolean {
  const me = interaction.guild?.members.me;
  return !me?.permissions.has(permission);
}

export async function fetchMember(
  guild: Guild,
  userId: string,
): Promise<GuildMember | null> {
  return guild.members.fetch(userId).catch(() => null);
}

export async function fetchTargetMember(
  interaction: ChatInputCommandInteraction,
  user: User,
): Promise<GuildMember | null> {
  if (!interaction.guild) return null;
  return fetchMember(interaction.guild, user.id);
}

/** Returns an error message when the actor may not act on the target. */
export function hierarchyError(
  actor: GuildMember,
  target: GuildMember,
  action: string,
): string | null {
  if (target.id === actor.user.id) return `You cannot ${action} yourself.`;
  if (target.id === actor.guild.ownerId)
    return `You cannot ${action} the server owner.`;
  if (
    actor.id !== target.id &&
    target.roles.highest.position >= actor.roles.highest.position
  ) {
    return `You cannot ${action} someone with an equal or higher top role.`;
  }
  return null;
}

/** Same check from the bot's point of view. */
export function botHierarchyError(
  target: GuildMember,
  action: string,
): string | null {
  const me = target.guild.members.me;
  if (!me) return "I am missing from this server.";
  if (target.id === me.id) return `I cannot ${action} myself.`;
  if (target.id === target.guild.ownerId)
    return `I cannot ${action} the server owner.`;
  if (target.roles.highest.position >= me.roles.highest.position) {
    return `My top role must be higher than the target's top role to ${action} them.`;
  }
  return null;
}

export async function createCase(
  guildId: string,
  type: string,
  userId: string,
  moderatorId: string,
  reason: string,
  metadata?: Record<string, unknown>,
): Promise<number | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  try {
    const last = await prisma.modCase.findFirst({
      where: { guildId },
      orderBy: { caseNumber: "desc" },
      select: { caseNumber: true },
    });
    const caseNumber = (last?.caseNumber ?? 0) + 1;
    const data: Prisma.ModCaseCreateInput = {
      guildId,
      caseNumber,
      type,
      userId,
      moderatorId,
      reason,
    };
    if (metadata) data.metadata = metadata as Prisma.InputJsonValue;
    await prisma.modCase.create({ data });
    return caseNumber;
  } catch {
    return null;
  }
}

export const DEFAULT_REASON = "No reason provided";
