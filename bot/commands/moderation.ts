import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type GuildChannel,
  type GuildMember,
} from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { formatDuration, parseDuration } from "../lib/duration";
import {
  DEFAULT_REASON,
  botHierarchyError,
  createCase,
  fetchTargetMember,
  hierarchyError,
  requirePermission,
} from "../lib/moderation";
import type { BotCommand } from "./types";

const ACCENT = 0x8b7cf8;
const MAX_TIMEOUT_MS = 28 * 86_400_000;

function ephemeral(content: string) {
  return { content, flags: MessageFlags.Ephemeral } as const;
}

function actionEmbed(
  title: string,
  target: string,
  moderator: string,
  reason: string,
  caseId: number | null = null,
) {
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle(title)
    .addFields(
      { name: "User", value: target, inline: true },
      { name: "Moderator", value: moderator, inline: true },
      { name: "Reason", value: reason, inline: false },
    )
    .setTimestamp();
  if (caseId) embed.setFooter({ text: `Case #${caseId}` });
  return embed;
}

const banCommand: BotCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName("user").setDescription("Member to ban").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Why they are being banned")),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.BanMembers))) return;
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? DEFAULT_REASON;
    const member = await fetchTargetMember(interaction, user);
    if (member) {
      const err =
        hierarchyError(interaction.member as GuildMember, member, "ban") ??
        botHierarchyError(member, "ban");
      if (err) return void (await interaction.reply(ephemeral(err)));
    }
    const ban = await interaction.guild!.bans
      .fetch(user.id)
      .then(() => true)
      .catch(() => false);
    if (ban) return void (await interaction.reply(ephemeral("That user is already banned.")));
    await user
      .send(
        `You were banned from **${interaction.guild!.name}**.\nReason: ${reason}`,
      )
      .catch(() => null);
    await interaction.guild!.members.ban(user.id, { reason }).catch((error: unknown) => {
      throw error;
    });
    const caseId = await createCase(interaction.guildId!, "ban", user.id, interaction.user.id, reason);
    await interaction.reply({
      embeds: [
        actionEmbed(
          "🔨 Member banned",
          `${user.tag} (<@${user.id}>)`,
          interaction.user.tag,
          reason,
          caseId,
        ),
      ],
    });
  },
};

const unbanCommand: BotCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user by ID or username")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((o) => o.setName("user").setDescription("User ID or username").setRequired(true)),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.BanMembers))) return;
    const query = interaction.options.getString("user", true).trim();
    const bans = await interaction.guild!.bans.fetch();
    const entry =
      bans.get(query) ??
      bans.find((b) => b.user.id === query || b.user.username.toLowerCase() === query.toLowerCase());
    if (!entry) return void (await interaction.reply(ephemeral("No ban found for that user.")));
    await interaction.guild!.members.unban(entry.user.id, "Unbanned via /unban");
    const caseId = await createCase(
      interaction.guildId!,
      "unban",
      entry.user.id,
      interaction.user.id,
      DEFAULT_REASON,
    );
    await interaction.reply({
      embeds: [
        actionEmbed(
          "🕊️ Member unbanned",
          `${entry.user.tag} (<@${entry.user.id}>)`,
          interaction.user.tag,
          DEFAULT_REASON,
          caseId,
        ),
      ],
    });
  },
};

const kickCommand: BotCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from the server")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) => o.setName("user").setDescription("Member to kick").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Why they are being kicked")),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.KickMembers))) return;
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") ?? DEFAULT_REASON;
    const member = await fetchTargetMember(interaction, user);
    if (!member) return void (await interaction.reply(ephemeral("That user is not in this server.")));
    const err =
      hierarchyError(interaction.member as GuildMember, member, "kick") ??
      botHierarchyError(member, "kick");
    if (err) return void (await interaction.reply(ephemeral(err)));
    await user
      .send(`You were kicked from **${interaction.guild!.name}**.\nReason: ${reason}`)
      .catch(() => null);
    await member.kick(reason);
    const caseId = await createCase(interaction.guildId!, "kick", user.id, interaction.user.id, reason);
    await interaction.reply({
      embeds: [
        actionEmbed(
          "👢 Member kicked",
          `${user.tag} (<@${user.id}>)`,
          interaction.user.tag,
          reason,
          caseId,
        ),
      ],
    });
  },
};

const timeoutCommand: BotCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout (mute) a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("user").setDescription("Member to timeout").setRequired(true))
    .addStringOption((o) =>
      o.setName("duration").setDescription("e.g. 10m, 1h, 1d (max 28d)").setRequired(true),
    )
    .addStringOption((o) => o.setName("reason").setDescription("Why they are being timed out")),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ModerateMembers))) return;
    const user = interaction.options.getUser("user", true);
    const durationInput = interaction.options.getString("duration", true);
    const reason = interaction.options.getString("reason") ?? DEFAULT_REASON;
    const ms = parseDuration(durationInput);
    if (!ms || ms > MAX_TIMEOUT_MS)
      return void (await interaction.reply(ephemeral("Give a duration like `10m`, `1h` or `1d` (max 28d).")));
    const member = await fetchTargetMember(interaction, user);
    if (!member) return void (await interaction.reply(ephemeral("That user is not in this server.")));
    const err =
      hierarchyError(interaction.member as GuildMember, member, "timeout") ??
      botHierarchyError(member, "timeout");
    if (err) return void (await interaction.reply(ephemeral(err)));
    await member.timeout(ms, reason);
    const caseId = await createCase(
      interaction.guildId!,
      "timeout",
      user.id,
      interaction.user.id,
      reason,
      { duration: formatDuration(ms) },
    );
    await interaction.reply({
      embeds: [
        actionEmbed(
          "⏳ Member timed out",
          `${user.tag} (<@${user.id}>)`,
          interaction.user.tag,
          `${reason} — for ${formatDuration(ms)}`,
          caseId,
        ),
      ],
    });
  },
};

const untimeoutCommand: BotCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Remove a member's timeout")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("user").setDescription("Member to lift the timeout from").setRequired(true)),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ModerateMembers))) return;
    const user = interaction.options.getUser("user", true);
    const member = await fetchTargetMember(interaction, user);
    if (!member) return void (await interaction.reply(ephemeral("That user is not in this server.")));
    if (!member.isCommunicationDisabled())
      return void (await interaction.reply(ephemeral("That member is not timed out.")));
    const err =
      hierarchyError(interaction.member as GuildMember, member, "untimeout") ??
      botHierarchyError(member, "untimeout");
    if (err) return void (await interaction.reply(ephemeral(err)));
    await member.timeout(null);
    const caseId = await createCase(
      interaction.guildId!,
      "untimeout",
      user.id,
      interaction.user.id,
      DEFAULT_REASON,
    );
    await interaction.reply({
      embeds: [
        actionEmbed(
          "✅ Timeout removed",
          `${user.tag} (<@${user.id}>)`,
          interaction.user.tag,
          DEFAULT_REASON,
          caseId,
        ),
      ],
    });
  },
};

const warnCommand: BotCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a member")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((o) => o.setName("user").setDescription("Member to warn").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Why they are being warned").setRequired(true)),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageMessages))) return;
    const prisma = getPrisma();
    if (!prisma) return void (await interaction.reply(ephemeral("Database unavailable.")));
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    if (user.bot) return void (await interaction.reply(ephemeral("You cannot warn a bot.")));
    const member = await fetchTargetMember(interaction, user);
    if (member) {
      const err = hierarchyError(interaction.member as GuildMember, member, "warn");
      if (err) return void (await interaction.reply(ephemeral(err)));
    }
    await prisma.warning.create({
      data: {
        guildId: interaction.guildId!,
        userId: user.id,
        moderatorId: interaction.user.id,
        reason,
      },
    });
    const count = await prisma.warning.count({
      where: { guildId: interaction.guildId!, userId: user.id },
    });
    const caseId = await createCase(interaction.guildId!, "warn", user.id, interaction.user.id, reason);
    await user
      .send(`⚠️ You were warned in **${interaction.guild!.name}**.\nReason: ${reason}`)
      .catch(() => null);
    await interaction.reply({
      embeds: [
        actionEmbed(
          "⚠️ Member warned",
          `${user.tag} (<@${user.id}>)`,
          interaction.user.tag,
          reason,
          caseId,
        )
          .addFields({ name: "Total warnings", value: String(count), inline: true }),
      ],
    });
  },
};

const warningsCommand: BotCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("List a member's warnings")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((o) => o.setName("user").setDescription("Member to inspect").setRequired(true)),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageMessages))) return;
    const prisma = getPrisma();
    if (!prisma) return void (await interaction.reply(ephemeral("Database unavailable.")));
    const user = interaction.options.getUser("user", true);
    const warnings = await prisma.warning.findMany({
      where: { guildId: interaction.guildId!, userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    });
    if (!warnings.length)
      return void (await interaction.reply(ephemeral(`**${user.tag}** has no warnings.`)));
    const total = await prisma.warning.count({
      where: { guildId: interaction.guildId!, userId: user.id },
    });
    const embed = new EmbedBuilder()
      .setColor(ACCENT)
      .setTitle(`Warnings for ${user.tag}`)
      .setDescription(
        warnings
          .map(
            (w, i) =>
              `**${total - i}.** ${w.reason} — <@${w.moderatorId}> · <t:${Math.floor(w.createdAt.getTime() / 1000)}:R>`,
          )
          .join("\n"),
      )
      .setFooter({ text: total > warnings.length ? `Showing latest ${warnings.length} of ${total}` : `${total} total` });
    await interaction.reply({ embeds: [embed] });
  },
};

const clearCommand: BotCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Bulk delete messages from this channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) =>
      o.setName("amount").setDescription("How many messages (1-100)").setRequired(true).setMinValue(1).setMaxValue(100),
    ),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageMessages))) return;
    const channel = interaction.channel;
    if (!channel || !("bulkDelete" in channel))
      return void (await interaction.reply(ephemeral("This channel does not support bulk delete.")));
    const amount = interaction.options.getInteger("amount", true);
    const deleted = await (channel as { bulkDelete: (n: number, f: boolean) => Promise<{ size: number }> }).bulkDelete(
      amount,
      true,
    );
    const caseId = await createCase(
      interaction.guildId!,
      "clear",
      "channel",
      interaction.user.id,
      `Deleted ${deleted.size} messages`,
      { channel: interaction.channelId, deleted: deleted.size },
    );
    await interaction.reply({
      content: `🗑️ Deleted **${deleted.size}** message(s).${caseId ? ` (Case #${caseId})` : ""}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

const slowmodeCommand: BotCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set the channel slowmode")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((o) =>
      o
        .setName("seconds")
        .setDescription("Seconds between messages (0 to disable)")
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600),
    ),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageChannels))) return;
    const channel = interaction.channel;
    if (!channel || !("setRateLimitPerUser" in channel))
      return void (await interaction.reply(ephemeral("Slowmode is not supported here.")));
    const seconds = interaction.options.getInteger("seconds", true);
    await (channel as GuildChannel & { setRateLimitPerUser: (n: number) => Promise<unknown> }).setRateLimitPerUser(seconds);
    await interaction.reply(
      seconds ? `🐢 Slowmode set to **${formatDuration(seconds * 1000)}**.` : " Slowmode disabled.",
    );
  },
};

function lockCommand(locked: boolean): BotCommand {
  return {
    category: "Moderation",
    data: new SlashCommandBuilder()
      .setName(locked ? "lock" : "unlock")
      .setDescription(locked ? "Lock this channel (no one can send messages)" : "Unlock this channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
      if (!(await requirePermission(interaction, PermissionFlagsBits.ManageChannels))) return;
      const channel = interaction.channel;
      if (!channel || !("permissionOverwrites" in channel))
        return void (await interaction.reply(ephemeral("This channel cannot be locked.")));
      await (channel as GuildChannel).permissionOverwrites.edit(interaction.guild!.roles.everyone.id, {
        SendMessages: !locked,
      });
      await interaction.reply(locked ? "🔒 Channel locked." : "🔓 Channel unlocked.");
    },
  };
}

const nickCommand: BotCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("nick")
    .setDescription("Change a member's nickname")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
    .addStringOption((o) => o.setName("nickname").setDescription("New nickname (32 chars max)").setRequired(true).setMaxLength(32)),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageNicknames))) return;
    const user = interaction.options.getUser("user", true);
    const nickname = interaction.options.getString("nickname", true);
    const member = await fetchTargetMember(interaction, user);
    if (!member) return void (await interaction.reply(ephemeral("That user is not in this server.")));
    const err =
      hierarchyError(interaction.member as GuildMember, member, "rename") ??
      botHierarchyError(member, "rename");
    if (err) return void (await interaction.reply(ephemeral(err)));
    await member.setNickname(nickname);
    await createCase(
      interaction.guildId!,
      "nick",
      user.id,
      interaction.user.id,
      `Nickname set to "${nickname}"`,
    );
    await interaction.reply(`✏️ **${user.tag}** is now known as **${nickname}**.`);
  },
};

const roleCommand: BotCommand = {
  category: "Moderation",
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Add or remove a member's role")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Give a member a role")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Role to add").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a role from a member")
        .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Role to remove").setRequired(true)),
    ),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageRoles))) return;
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser("user", true);
    const roleOption = interaction.options.getRole("role", true);
    const role = interaction.guild!.roles.cache.get(roleOption.id);
    if (!role) return void (await interaction.reply(ephemeral("That role no longer exists.")));
    const member = await fetchTargetMember(interaction, user);
    if (!member) return void (await interaction.reply(ephemeral("That user is not in this server.")));
    const me = interaction.guild!.members.me!;
    if (role.id === interaction.guild!.roles.everyone.id)
      return void (await interaction.reply(ephemeral("You cannot manage @everyone.")));
    if (role.managed || role.id === interaction.guild!.roles.everyone.id)
      return void (await interaction.reply(ephemeral("That role is managed by an integration.")));
    if (role.position >= me.roles.highest.position)
      return void (await interaction.reply(ephemeral("That role is above my top role.")));
    const actor = interaction.member as GuildMember;
    if (role.position >= actor.roles.highest.position)
      return void (await interaction.reply(ephemeral("That role is above your top role.")));
    if (sub === "add") {
      if (member.roles.cache.has(role.id))
        return void (await interaction.reply(ephemeral("They already have that role.")));
      await member.roles.add(role);
      await interaction.reply(`✅ Added **${role.name}** to **${user.tag}**.`);
    } else {
      if (!member.roles.cache.has(role.id))
        return void (await interaction.reply(ephemeral("They do not have that role.")));
      await member.roles.remove(role);
      await interaction.reply(`🗑️ Removed **${role.name}** from **${user.tag}**.`);
    }
    await createCase(
      interaction.guildId!,
      `role_${sub}`,
      user.id,
      interaction.user.id,
      `${sub === "add" ? "Added" : "Removed"} role ${role.name}`,
    );
  },
};

export const moderationCommands: BotCommand[] = [
  banCommand,
  unbanCommand,
  kickCommand,
  timeoutCommand,
  untimeoutCommand,
  warnCommand,
  warningsCommand,
  clearCommand,
  slowmodeCommand,
  lockCommand(true),
  lockCommand(false),
  nickCommand,
  roleCommand,
];
