import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  time,
  type ChatInputCommandInteraction,
  type User,
} from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { getConfig } from "../lib/guildconfig";
import { parseDuration, formatDuration } from "../lib/duration";
import { requirePermission } from "../lib/moderation";
import { ensureProfile, levelFromXp, progressBar, xpForLevel } from "../lib/xp";
import { getEconomy } from "../lib/economy";
import type { BotCommand } from "./types";

const ACCENT = 0x8b7cf8;

function embed(title: string, description?: string) {
  const e = new EmbedBuilder().setColor(ACCENT).setTitle(title);
  if (description) e.setDescription(description);
  return e;
}

const profileCommand: BotCommand = {
  category: "Community",
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Show your (or someone's) server profile")
    .addUserOption((o) => o.setName("user").setDescription("Whose profile (default: you)"))
    .addStringOption((o) => o.setName("bio").setDescription("Set your profile bio (your own only)").setMaxLength(200)),
  async execute(interaction) {
    const prisma = getPrisma();
    if (!prisma) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const target = interaction.options.getUser("user") ?? interaction.user;
    const bio = interaction.options.getString("bio");
    if (bio !== null) {
      if (target.id !== interaction.user.id) {
        await interaction.reply({ content: "You can only set your own bio.", flags: MessageFlags.Ephemeral });
        return;
      }
      await ensureProfile(interaction.guildId!, target.id);
      await prisma.memberProfile.update({
        where: { guildId_userId: { guildId: interaction.guildId!, userId: target.id } },
        data: { bio },
      });
      await interaction.reply({ content: "✅ Bio updated.", flags: MessageFlags.Ephemeral });
      return;
    }
    const profile = await ensureProfile(interaction.guildId!, target.id);
    if (!profile) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const level = levelFromXp(profile.xp);
    const base = xpForLevel(level);
    const next = xpForLevel(level + 1);
    const percent = Math.round(((profile.xp - base) / Math.max(1, next - base)) * 100);
    const member = await interaction.guild!.members.fetch(target.id).catch(() => null);
    const economy = await getEconomy(interaction.guildId!, target.id);
    await interaction.reply({
      embeds: [
        embed(`📄 ${target.username}'s profile`)
          .setThumbnail(target.displayAvatarURL({ size: 256 }))
          .addFields(
            { name: "Level", value: String(level), inline: true },
            { name: "XP", value: `${profile.xp} (next at ${next})`, inline: true },
            { name: "Reputation", value: String(profile.rep), inline: true },
            { name: "Messages", value: String(profile.messages), inline: true },
            { name: "Streak", value: `🔥 ${economy?.streak ?? 0}`, inline: true },
            { name: "Coins", value: String((economy?.balance ?? 0) + (economy?.bank ?? 0)), inline: true },
            { name: "Progress", value: `\`${progressBar(percent)}\` ${percent}%` },
            { name: "Bio", value: profile.bio ?? "No bio yet — use `/profile bio:` to set one." },
            { name: "Server joined", value: member?.joinedAt ? time(member.joinedAt, "D") : "Unknown" },
          ),
      ],
    });
  },
};

const repCommand: BotCommand = {
  category: "Community",
  data: new SlashCommandBuilder()
    .setName("rep")
    .setDescription("Give someone reputation")
    .addUserOption((o) => o.setName("user").setDescription("Who deserves praise").setRequired(true)),
  async execute(interaction) {
    const prisma = getPrisma();
    const target = interaction.options.getUser("user", true);
    if (!prisma || target.bot || target.id === interaction.user.id) {
      await interaction.reply({
        content: target.bot ? "Bots have no reputation to gain." : prisma ? "You can't rep yourself." : "Database unavailable.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const profile = await ensureProfile(interaction.guildId!, target.id);
    if (!profile) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    if (profile.repAt && Date.now() - profile.repAt.getTime() < 12 * 3_600_000) {
      await interaction.reply({
        content: `You already gave rep recently — try again <t:${Math.floor((profile.repAt.getTime() + 12 * 3_600_000) / 1000)}:R>.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await prisma.memberProfile.update({
      where: { guildId_userId: { guildId: interaction.guildId!, userId: target.id } },
      data: { rep: profile.rep + 1, repAt: new Date() },
    });
    await interaction.reply(`⭐ You gave **${target.username}** +1 reputation! They now have **${profile.rep + 1}**.`);
  },
};

function levelishCommand(mode: "level" | "rank"): BotCommand {
  return {
    category: "Community",
    data: new SlashCommandBuilder()
      .setName(mode)
      .setDescription(mode === "level" ? "Show your level and XP" : "Your position on the XP leaderboard")
      .addUserOption((o) => o.setName("user").setDescription("Whose rank (default: you)")),
    async execute(interaction) {
      await interaction.deferReply();
      const prisma = getPrisma();
      const target = interaction.options.getUser("user") ?? interaction.user;
      const profile = await ensureProfile(interaction.guildId!, target.id);
      if (!prisma || !profile) {
        await interaction.editReply("Database unavailable.");
        return;
      }
      const level = levelFromXp(profile.xp);
      const base = xpForLevel(level);
      const next = xpForLevel(level + 1);
      const percent = Math.round(((profile.xp - base) / Math.max(1, next - base)) * 100);
      const above = await prisma.memberProfile.count({
        where: { guildId: interaction.guildId!, xp: { gt: profile.xp } },
      });
      const total = await prisma.memberProfile.count({ where: { guildId: interaction.guildId! } });
      const embedBuilder = embed(
        mode === "level" ? `📈 ${target.username}'s level` : `🏆 ${target.username}'s rank`,
      )
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "Level", value: String(level), inline: true },
          { name: "XP", value: String(profile.xp), inline: true },
          { name: "Position", value: `#${above + 1} of ${total}`, inline: true },
          { name: "Progress", value: `\`${progressBar(percent)}\` ${percent}% to level ${level + 1}` },
        );
      await interaction.editReply({ embeds: [embedBuilder] });
    },
  };
}

const streakCommand: BotCommand = {
  category: "Community",
  data: new SlashCommandBuilder()
    .setName("streak")
    .setDescription("Show your daily streak")
    .addUserOption((o) => o.setName("user").setDescription("Whose streak (default: you)")),
  async execute(interaction) {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const economy = await getEconomy(interaction.guildId!, target.id);
    if (!economy) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const nextIn = economy.dailyAt ? 20 * 3_600_000 - (Date.now() - economy.dailyAt.getTime()) : 0;
    await interaction.reply(
      `🔥 **${target.username}** has a **${economy.streak} day** streak! ` +
        (nextIn > 0
          ? `Next /daily claim <t:${Math.floor((Date.now() + nextIn) / 1000)}:R>.`
          : "Ready to claim /daily now!"),
    );
  },
};

const afkCommand: BotCommand = {
  category: "Community",
  data: new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Set (or clear) your AFK status")
    .addStringOption((o) => o.setName("reason").setDescription("Why you're away").setMaxLength(150)),
  async execute(interaction) {
    const prisma = getPrisma();
    if (!prisma) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const reason = interaction.options.getString("reason") ?? "AFK";
    const existing = await prisma.afk.findUnique({
      where: { guildId_userId: { guildId: interaction.guildId!, userId: interaction.user.id } },
    });
    if (existing) {
      await prisma.afk.delete({
        where: { guildId_userId: { guildId: interaction.guildId!, userId: interaction.user.id } },
      });
      await interaction.reply(`👋 Welcome back — your AFK has been cleared.`);
      return;
    }
    await prisma.afk.create({
      data: { guildId: interaction.guildId!, userId: interaction.user.id, reason },
    });
    await interaction.reply(`😴 You're now AFK: **${reason.slice(0, 150)}**`);
  },
};

const suggestCommand: BotCommand = {
  category: "Community",
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Suggest something for the server/community")
    .addStringOption((o) => o.setName("idea").setDescription("Your suggestion").setRequired(true).setMaxLength(800)),
  async execute(interaction) {
    const prisma = getPrisma();
    if (!prisma) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const content = interaction.options.getString("idea", true);
    const config = await getConfig(interaction.guildId!);
    const channelId = config?.suggestionsChannelId ?? interaction.channelId;
    const channel = await interaction.guild!.channels.fetch(channelId).catch(() => null);
    if (!channel || !("send" in channel)) {
      await interaction.reply({ content: "No valid channel for suggestions.", flags: MessageFlags.Ephemeral });
      return;
    }
    const suggestion = await prisma.suggestion.create({
      data: { guildId: interaction.guildId!, userId: interaction.user.id, content },
    });
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`sugg:${suggestion.id}:accepted`)
        .setLabel("Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`sugg:${suggestion.id}:denied`).setLabel("Deny").setStyle(ButtonStyle.Danger),
    );
    const message = await (channel as { send: (o: object) => Promise<{ id: string }> }).send({
      embeds: [
        embed(`💡 Suggestion \`${suggestion.id.slice(-6)}\``)
          .setDescription(content)
          .setFooter({ text: `Submitted by ${interaction.user.tag}` })
          .setTimestamp(),
      ],
      components: [buttonRow],
    });
    await prisma.suggestion.update({ where: { id: suggestion.id }, data: { messageId: message.id } });
    await interaction.reply({ content: "💡 Suggestion submitted!", flags: MessageFlags.Ephemeral });
  },
};

const reportCommand: BotCommand = {
  category: "Community",
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report a user to the staff team")
    .addUserOption((o) => o.setName("user").setDescription("Who are you reporting?").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("What happened?").setRequired(true).setMaxLength(600)),
  async execute(interaction) {
    const prisma = getPrisma();
    if (!prisma) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    await prisma.report.create({
      data: {
        guildId: interaction.guildId!,
        userId: interaction.user.id,
        targetId: target.id,
        reason,
      },
    });
    const config = await getConfig(interaction.guildId!);
    if (config?.logsChannelId) {
      const channel = await interaction.guild!.channels.fetch(config.logsChannelId).catch(() => null);
      if (channel && "send" in channel) {
        await (channel as { send: (o: object) => Promise<unknown> }).send({
          embeds: [
            embed(`🚨 Report: ${target.tag}`)
              .setDescription(
                `**Reported:** <@${target.id}>\n**By:** ${interaction.user.tag}\n**Reason:** ${reason}`,
              )
              .setTimestamp(),
          ],
        });
      }
    }
    await interaction.reply({
      content: "✅ Report filed — the staff team will take a look.",
      flags: MessageFlags.Ephemeral,
    });
  },
};

const pollCommand: BotCommand = {
  category: "Community",
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Run a poll (2-8 options)")
    .addStringOption((o) => o.setName("question").setDescription("The question").setRequired(true).setMaxLength(250))
    .addStringOption((o) =>
      o.setName("options").setDescription("Options separated by | (e.g. yes | no | maybe)").setRequired(true).setMaxLength(400),
    )
    .addStringOption((o) => o.setName("duration").setDescription("How long (default 1h, max 7d)")),
  async execute(interaction) {
    const prisma = getPrisma();
    if (!prisma) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const question = interaction.options.getString("question", true);
    const options = interaction.options
      .getString("options", true)
      .split(/[|,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);
    if (options.length < 2) {
      await interaction.reply({ content: "Give at least 2 options separated by `|`.", flags: MessageFlags.Ephemeral });
      return;
    }
    const durationInput = interaction.options.getString("duration");
    const ms = durationInput ? parseDuration(durationInput) : 3_600_000;
    if (!ms || ms < 30_000 || ms > 7 * 86_400_000) {
      await interaction.reply({ content: "Duration must be between 30s and 7d (e.g. `30m`, `2h`).", flags: MessageFlags.Ephemeral });
      return;
    }
    const poll = await prisma.poll.create({
      data: {
        guildId: interaction.guildId!,
        channelId: interaction.channelId,
        messageId: "",
        question,
        options,
        votes: {},
        endsAt: new Date(Date.now() + ms),
      },
    });
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`poll:${poll.id}`)
      .setPlaceholder("Cast your vote")
      .addOptions(options.map((label, index) => ({ label: label.slice(0, 100), value: String(index) })));
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
    const message = await (interaction.channel as { send: (o: object) => Promise<{ id: string }> }).send({
      embeds: [
        new EmbedBuilder()
          .setColor(ACCENT)
          .setTitle(`📊 ${question}`)
          .setDescription(options.map((label, index) => `**${index + 1}.** ${label}`).join("\n"))
          .setFooter({ text: `Poll ends in ${formatDuration(ms)} · ID ${poll.id}` }),
      ],
      components: [row],
    });
    await prisma.poll.update({ where: { id: poll.id }, data: { messageId: message.id } });
    await interaction.reply({ content: "📊 Poll is live!", flags: MessageFlags.Ephemeral });
  },
};

const remindCommand: BotCommand = {
  category: "Community",
  data: new SlashCommandBuilder()
    .setName("remind")
    .setDescription("Set a reminder")
    .addStringOption((o) => o.setName("time").setDescription("e.g. 10m, 1h30m, 2d").setRequired(true))
    .addStringOption((o) => o.setName("message").setDescription("What should I remind you about?").setRequired(true).setMaxLength(300)),
  async execute(interaction) {
    const prisma = getPrisma();
    if (!prisma) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const ms = parseDuration(interaction.options.getString("time", true));
    if (!ms || ms < 30_000 || ms > 90 * 86_400_000) {
      await interaction.reply({ content: "Give a time between 30s and 90d (e.g. `25m`, `3h`, `7d`).", flags: MessageFlags.Ephemeral });
      return;
    }
    const message = interaction.options.getString("message", true);
    const remindAt = new Date(Date.now() + ms);
    const reminder = await prisma.reminder.create({
      data: {
        userId: interaction.user.id,
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        remindAt,
        message,
      },
    });
    await interaction.reply({
      content: `⏰ I'll remind you <t:${Math.floor(remindAt.getTime() / 1000)}:F> (in ${formatDuration(ms)}) — ID \`${reminder.id}\``,
      flags: MessageFlags.Ephemeral,
    });
  },
};

const membercountCommand: BotCommand = {
  category: "Community",
  data: new SlashCommandBuilder()
    .setName("membercount")
    .setDescription("How many members does this server have?"),
  async execute(interaction) {
    const guild = interaction.guild!;
    await interaction.reply(
      `👥 **${guild.memberCount.toLocaleString("en-US")}** members in **${guild.name}**.`,
    );
  },
};

const serverstatsCommand: BotCommand = {
  category: "Community",
  data: new SlashCommandBuilder()
    .setName("serverstats")
    .setDescription("Activity analytics for this server"),
  async execute(interaction) {
    await interaction.deferReply();
    const prisma = getPrisma();
    const guildId = interaction.guildId!;
    if (!prisma) {
      await interaction.editReply("Database unavailable.");
      return;
    }
    const [profiles, messages, suggestions, openTickets, activeGiveaways, warnings, reports, subs] =
      await Promise.all([
        prisma.memberProfile.count({ where: { guildId } }),
        prisma.memberProfile.aggregate({ where: { guildId }, _sum: { messages: true, xp: true } }),
        prisma.suggestion.count({ where: { guildId } }),
        prisma.ticket.count({ where: { guildId, status: "open" } }),
        prisma.giveaway.count({ where: { guildId, ended: false } }),
        prisma.warning.count({ where: { guildId } }),
        prisma.report.count({ where: { guildId } }),
        prisma.subscription.count({ where: { guildId } }),
      ]);
    await interaction.editReply({
      embeds: [
        embed(`📊 Server analytics — ${interaction.guild!.name}`).addFields(
          { name: "Members", value: interaction.guild!.memberCount.toLocaleString("en-US"), inline: true },
          { name: "Tracked members", value: String(profiles), inline: true },
          { name: "Messages seen", value: String(messages._sum.messages ?? 0), inline: true },
          { name: "Total XP", value: String(messages._sum.xp ?? 0), inline: true },
          { name: "Suggestions", value: String(suggestions), inline: true },
          { name: "Open tickets", value: String(openTickets), inline: true },
          { name: "Active giveaways", value: String(activeGiveaways), inline: true },
          { name: "Warnings", value: String(warnings), inline: true },
          { name: "Reports", value: String(reports), inline: true },
          { name: "Subscriptions", value: String(subs), inline: true },
        ),
      ],
    });
  },
};

async function targetMember(
  interaction: ChatInputCommandInteraction,
  user: User,
): Promise<{ tag: string; joined: Date | null; roles: string[]; bot: boolean } | null> {
  const member = await interaction.guild!.members.fetch(user.id).catch(() => null);
  if (!member) return null;
  return {
    tag: member.user.tag,
    joined: member.joinedAt,
    roles: member.roles.cache.filter((r) => r.id !== interaction.guildId).map((r) => `<@&${r.id}>`),
    bot: member.user.bot,
  };
}

const whoisCommand: BotCommand = {
  category: "Community",
  data: new SlashCommandBuilder()
    .setName("whois")
    .setDescription("Detailed profile of a server member")
    .addUserOption((o) => o.setName("user").setDescription("User (default: you)")),
  async execute(interaction) {
    const prisma = getPrisma();
    const target = interaction.options.getUser("user") ?? interaction.user;
    const member = await targetMember(interaction, target);
    const created = new Date(Number(BigInt(target.id) >> 22n) + 1420070400000);
    const profile = prisma ? await ensureProfile(interaction.guildId!, target.id) : null;
    const economy = await getEconomy(interaction.guildId!, target.id);
    const afk = prisma
      ? await prisma.afk.findUnique({
          where: { guildId_userId: { guildId: interaction.guildId!, userId: target.id } },
        })
      : null;
    const warnings = prisma
      ? await prisma.warning.count({ where: { guildId: interaction.guildId!, userId: target.id } })
      : 0;
    await interaction.reply({
      embeds: [
        embed(`🕵️ Who is ${target.tag}?`)
          .setThumbnail(target.displayAvatarURL({ size: 256 }))
          .addFields(
            { name: "ID", value: target.id, inline: true },
            { name: "Account created", value: time(created, "D"), inline: true },
            {
              name: "Server joined",
              value: member?.joined ? time(member.joined, "D") : "Not a member",
              inline: true,
            },
            { name: "Level / XP", value: profile ? `${levelFromXp(profile.xp)} / ${profile.xp}` : "—", inline: true },
            { name: "Rep", value: String(profile?.rep ?? 0), inline: true },
            { name: "Coins", value: String((economy?.balance ?? 0) + (economy?.bank ?? 0)), inline: true },
            { name: "Warnings", value: String(warnings), inline: true },
            { name: "AFK", value: afk ? `**${afk.reason}**` : "Active", inline: true },
            {
              name: `Roles (${member?.roles.length ?? 0})`,
              value: member?.roles.slice(0, 20).join(" ").slice(0, 1000) || "None",
            },
          ),
      ],
    });
  },
};

const auditCommand: BotCommand = {
  category: "Community",
  data: new SlashCommandBuilder()
    .setName("audit")
    .setDescription("Moderation history for a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((o) => o.setName("user").setDescription("User to audit").setRequired(true)),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageMessages))) return;
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const prisma = getPrisma();
    const target = interaction.options.getUser("user", true);
    if (!prisma) {
      await interaction.editReply("Database unavailable.");
      return;
    }
    const [warnings, cases] = await Promise.all([
      prisma.warning.findMany({
        where: { guildId: interaction.guildId!, userId: target.id },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.modCase.findMany({
        where: { guildId: interaction.guildId!, userId: target.id },
        orderBy: { caseNumber: "desc" },
        take: 8,
      }),
    ]);
    if (!warnings.length && !cases.length) {
      await interaction.editReply(`No moderation history for **${target.tag}**. Clean record.`);
      return;
    }
    const warningLines = warnings.map(
      (w) => `• ${w.reason} — <@${w.moderatorId}> <t:${Math.floor(w.createdAt.getTime() / 1000)}:R>`,
    );
    const caseLines = cases.map(
      (c) => `• **#${c.caseNumber}** ${c.type}: ${c.reason} — <@${c.moderatorId}>`,
    );
    await interaction.editReply({
      embeds: [
        embed(`🕵️ Audit — ${target.tag}`).addFields(
          { name: `Warnings (${warnings.length}+)`, value: warningLines.join("\n").slice(0, 1024) || "None" },
          { name: `Cases (${cases.length}+)`, value: caseLines.join("\n").slice(0, 1024) || "None" },
        ),
      ],
    });
  },
};

const caseCommand: BotCommand = {
  category: "Community",
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("Look up a moderation case")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) => o.setName("case_id").setDescription("Case number").setRequired(true).setMinValue(1)),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageMessages))) return;
    const prisma = getPrisma();
    const caseNumber = interaction.options.getInteger("case_id", true);
    if (!prisma) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const record = await prisma.modCase.findUnique({
      where: { guildId_caseNumber: { guildId: interaction.guildId!, caseNumber } },
    });
    if (!record) {
      await interaction.reply({ content: `No case **#${caseNumber}** found.`, flags: MessageFlags.Ephemeral });
      return;
    }
    await interaction.reply({
      embeds: [
        embed(`⚖️ Case #${record.caseNumber}`).addFields(
          { name: "Type", value: record.type, inline: true },
          { name: "Target", value: `<@${record.userId}>`, inline: true },
          { name: "Moderator", value: `<@${record.moderatorId}>`, inline: true },
          { name: "Reason", value: record.reason.slice(0, 1000) },
          { name: "Date", value: time(record.createdAt, "F"), inline: true },
        ),
      ],
    });
  },
};

export const customCommands: BotCommand[] = [
  profileCommand,
  repCommand,
  levelishCommand("level"),
  levelishCommand("rank"),
  streakCommand,
  afkCommand,
  suggestCommand,
  reportCommand,
  pollCommand,
  remindCommand,
  membercountCommand,
  serverstatsCommand,
  whoisCommand,
  auditCommand,
  caseCommand,
];
