import {
  EmbedBuilder,
  SlashCommandBuilder,
  time,
  version as djsVersion,
} from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { formatDuration } from "../lib/duration";
import type { BotCommand } from "./types";

const ACCENT = 0x8b7cf8;

function snowflakeDate(id: string): Date | null {
  try {
    return new Date(Number(BigInt(id) >> 22n) + 1420070400000);
  } catch {
    return null;
  }
}

function embed(title: string) {
  return new EmbedBuilder().setColor(ACCENT).setTitle(title);
}

const pingCommand: BotCommand = {
  category: "Utility",
  data: new SlashCommandBuilder().setName("ping").setDescription("Check the bot's latency"),
  async execute(interaction) {
    const sent = await interaction.reply({ content: "Pinging…", fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(
      `🏓 **Pong!** Gateway: **${interaction.client.ws.ping}ms** · Reply: **${roundtrip}ms**`,
    );
  },
};

const userinfoCommand: BotCommand = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Information about a user")
    .addUserOption((o) => o.setName("user").setDescription("User (defaults to you)")),
  async execute(interaction) {
    const user = interaction.options.getUser("user") ?? interaction.user;
    const member = await interaction.guild!.members.fetch(user.id).catch(() => null);
    const created = snowflakeDate(user.id);
    const embedBuilder = embed(`User info — ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "ID", value: user.id, inline: true },
        { name: "Bot", value: user.bot ? "Yes" : "No", inline: true },
        { name: "Created", value: created ? time(created, "F") : "Unknown", inline: true },
      );
    if (member) {
      const topRole = member.roles.highest;
      embedBuilder.addFields(
        { name: "Joined", value: member.joinedAt ? time(member.joinedAt, "F") : "Unknown", inline: true },
        { name: "Top role", value: topRole.name === "@everyone" ? "@everyone" : `${topRole}`, inline: true },
        { name: "Roles", value: String(member.roles.cache.size), inline: true },
        { name: "Nickname", value: member.nickname ?? "None", inline: true },
      );
    } else {
      embedBuilder.addFields({ name: "Server", value: "Not a member here", inline: true });
    }
    if (user.flags && user.flags.toArray().length)
      embedBuilder.addFields({
        name: "Badges",
        value: user.flags.toArray().map((f) => `\`${f}\``).join(", "),
      });
    embedBuilder.addFields({ name: "Mention", value: `<@${user.id}>` });
    await interaction.reply({ embeds: [embedBuilder] });
  },
};

const serverinfoCommand: BotCommand = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Information about this server"),
  async execute(interaction) {
    const guild = interaction.guild!;
    const created = snowflakeDate(guild.id);
    const channels = guild.channels.cache;
    const embedBuilder = embed(`Server info — ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: "ID", value: guild.id, inline: true },
        { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "Created", value: created ? time(created, "F") : "Unknown", inline: true },
        { name: "Members", value: String(guild.memberCount), inline: true },
        {
          name: "Channels",
          value: `${channels.filter((c) => c.isTextBased()).size} text · ${channels.filter((c) => c.type === 2).size} voice`,
          inline: true,
        },
        { name: "Roles", value: String(guild.roles.cache.size), inline: true },
        { name: "Emojis", value: String(guild.emojis.cache.size), inline: true },
        { name: "Verification", value: `Level ${guild.verificationLevel}`, inline: true },
        {
          name: "Boosts",
          value: `Tier ${guild.premiumTier} · ${guild.premiumSubscriptionCount ?? 0} boosts`,
          inline: true,
        },
      );
    if (guild.description)
      embedBuilder.addFields({ name: "Description", value: guild.description });
    await interaction.reply({ embeds: [embedBuilder] });
  },
};

function userMediaCommand(kind: "avatar" | "banner"): BotCommand {
  return {
    category: "Utility",
    data: new SlashCommandBuilder()
      .setName(kind)
      .setDescription(`Show a user's ${kind}`)
      .addUserOption((o) => o.setName("user").setDescription(`User (defaults to you)`)),
    async execute(interaction) {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const url =
        kind === "avatar"
          ? user.displayAvatarURL({ size: 4096, extension: "png" })
          : user.bannerURL({ size: 4096, extension: "png" });
      if (!url) {
        await interaction.reply(
          kind === "banner"
            ? `**${user.tag}** has no banner.`
            : `**${user.tag}** has no avatar.`,
        );
        return;
      }
      await interaction.reply({
        embeds: [
          embed(`${kind === "avatar" ? "Avatar" : "Banner"} — ${user.tag}`)
            .setImage(url)
            .setFooter({ text: "Click the image for the full size" }),
        ],
      });
    },
  };
}

const roleinfoCommand: BotCommand = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("roleinfo")
    .setDescription("Information about a role")
    .addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)),
  async execute(interaction) {
    const roleOption = interaction.options.getRole("role", true);
    const role = interaction.guild!.roles.cache.get(roleOption.id);
    if (!role) {
      await interaction.reply({ content: "That role no longer exists." });
      return;
    }
    const embedBuilder = embed(`Role info — ${role.name}`)
      .addFields(
        { name: "ID", value: role.id, inline: true },
        { name: "Color", value: role.hexColor.toUpperCase(), inline: true },
        { name: "Position", value: String(role.position), inline: true },
        { name: "Members", value: String(role.members.size), inline: true },
        { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
        { name: "Hoisted", value: role.hoist ? "Yes" : "No", inline: true },
        { name: "Managed", value: role.managed ? "Yes" : "No", inline: true },
        { name: "Created", value: time(role.createdAt, "F"), inline: true },
        { name: "Permissions", value: String(role.permissions.toArray().length), inline: true },
      )
      .setColor(role.color || ACCENT);
    await interaction.reply({ embeds: [embedBuilder] });
  },
};

const channelinfoCommand: BotCommand = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("channelinfo")
    .setDescription("Information about a channel")
    .addChannelOption((o) => o.setName("channel").setDescription("Channel (defaults to here)")),
  async execute(interaction) {
    const option = interaction.options.getChannel("channel");
    const channel = (option ?? interaction.channel) as {
      id: string;
      name: string;
      type: number;
      createdAt: Date;
      isTextBased?: () => boolean;
      topic?: string | null;
      nsfw?: boolean;
      rateLimitPerUser?: number;
      parentId?: string | null;
    } | null;
    if (!channel) {
      await interaction.reply({ content: "Channel not found." });
      return;
    }
    const embedBuilder = embed(`Channel info — #${channel.name}`).addFields(
      { name: "ID", value: channel.id, inline: true },
      { name: "Type", value: String(channel.type), inline: true },
      { name: "Created", value: time(channel.createdAt, "F"), inline: true },
    );
    if ("topic" in channel && channel.topic)
      embedBuilder.addFields({ name: "Topic", value: channel.topic.slice(0, 1000) });
    if ("rateLimitPerUser" in channel)
      embedBuilder.addFields({
        name: "Slowmode",
        value: channel.rateLimitPerUser ? formatDuration(channel.rateLimitPerUser * 1000) : "Off",
        inline: true,
      });
    if ("nsfw" in channel)
      embedBuilder.addFields({ name: "NSFW", value: channel.nsfw ? "Yes" : "No", inline: true });
    if (channel.parentId)
      embedBuilder.addFields({ name: "Category", value: `<#${channel.parentId}>`, inline: true });
    await interaction.reply({ embeds: [embedBuilder] });
  },
};

const botinfoCommand: BotCommand = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Information about this bot"),
  async execute(interaction) {
    const client = interaction.client;
    const user = client.user;
    const embedBuilder = embed(`Bot info — ${user?.tag ?? "DarkUniverse"}`)
      .setThumbnail(user?.displayAvatarURL({ size: 256 }) ?? null)
      .addFields(
        { name: "ID", value: user?.id ?? "Unknown", inline: true },
        { name: "Servers", value: String(client.guilds.cache.size), inline: true },
        { name: "Latency", value: `${client.ws.ping}ms`, inline: true },
        { name: "Uptime", value: formatDuration(process.uptime() * 1000), inline: true },
        { name: "Memory", value: `${(process.memoryUsage().rss / 1048576).toFixed(1)} MB`, inline: true },
        { name: "Node", value: process.version, inline: true },
        { name: "Discord.js", value: `v${djsVersion}`, inline: true },
        { name: "Dashboard", value: "[darkuniverse-hub.vercel.app](https://darkuniverse-hub.vercel.app)" },
      );
    await interaction.reply({ embeds: [embedBuilder] });
  },
};

const inviteCommand: BotCommand = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Get the bot invite link and our community links"),
  async execute(interaction) {
    const clientId = interaction.client.user?.id ?? "";
    const botInvite = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
    await interaction.reply({
      embeds: [
        embed("Invite DarkUniverse").addFields(
          { name: "🤖 Add the bot", value: `[Click here](${botInvite})` },
          { name: "🌐 Dashboard", value: "[darkuniverse-hub.vercel.app](https://darkuniverse-hub.vercel.app)" },
        ),
      ],
    });
  },
};

const uptimeCommand: BotCommand = {
  category: "Utility",
  data: new SlashCommandBuilder().setName("uptime").setDescription("How long has the bot been up?"),
  async execute(interaction) {
    await interaction.reply(
      `⏱️ Uptime: **${formatDuration(process.uptime() * 1000)}** (started ${time(new Date(Date.now() - process.uptime() * 1000), "R")})`,
    );
  },
};

const statsCommand: BotCommand = {
  category: "Utility",
  data: new SlashCommandBuilder().setName("stats").setDescription("Server activity statistics"),
  async execute(interaction) {
    await interaction.deferReply();
    const prisma = getPrisma();
    const guildId = interaction.guildId!;
    const guild = interaction.guild!;
    if (!prisma) {
      await interaction.editReply("Database unavailable — statistics are offline.");
      return;
    }
    const [members, economy, warnings, profiles] = await Promise.all([
      prisma.memberProfile.aggregate({ where: { guildId }, _sum: { messages: true, xp: true } }),
      prisma.economy.aggregate({ where: { guildId }, _sum: { balance: true, bank: true } }),
      prisma.warning.count({ where: { guildId } }),
      prisma.memberProfile.findMany({
        where: { guildId },
        orderBy: { messages: "desc" },
        take: 5,
      }),
    ]);
    const topChatters = profiles.length
      ? profiles.map((p, i) => `**${i + 1}.** <@${p.userId}> — ${p.messages} msgs`).join("\n")
      : "No messages tracked yet.";
    await interaction.editReply({
      embeds: [
        embed(`Stats — ${guild.name}`)
          .addFields(
            { name: "Members", value: String(guild.memberCount), inline: true },
            { name: "Messages tracked", value: String(members._sum.messages ?? 0), inline: true },
            { name: "Total XP", value: String(members._sum.xp ?? 0), inline: true },
            { name: "Coins in circulation", value: String((economy._sum.balance ?? 0) + (economy._sum.bank ?? 0)), inline: true },
            { name: "Warnings issued", value: String(warnings), inline: true },
            { name: "Top chatters", value: topChatters.slice(0, 1024) },
          ),
      ],
    });
  },
};


export const utilityCommands: BotCommand[] = [
  pingCommand,
  userinfoCommand,
  serverinfoCommand,
  userMediaCommand("avatar"),
  userMediaCommand("banner"),
  roleinfoCommand,
  channelinfoCommand,
  botinfoCommand,
  inviteCommand,
  uptimeCommand,
  statsCommand,
];


