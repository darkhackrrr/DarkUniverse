import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { requirePermission } from "../lib/moderation";
import {
  resolveRobloxUser,
  resolveTwitchUser,
  resolveTwitterUser,
  resolveYouTubeChannelId,
  twitchConfigured,
  twitterConfigured,
} from "../lib/subscriptions";
import type { BotCommand } from "./types";

const ACCENT = 0x8b7cf8;
type SubType = "youtube" | "twitch" | "twitter" | "roblox";

async function resolveTarget(type: SubType, input: string): Promise<{ id: string | null; label: string }> {
  if (type === "youtube") {
    const id = await resolveYouTubeChannelId(input);
    return { id, label: id ? `YouTube channel \`${id}\`` : "Couldn't resolve that YouTube channel." };
  }
  if (type === "roblox") {
    const user = await resolveRobloxUser(input);
    return { id: user?.id ?? null, label: user ? `Roblox user **${user.name}**` : "Couldn't find that Roblox user." };
  }
  if (type === "twitch") {
    if (!twitchConfigured())
      return { id: null, label: "Twitch needs `TWITCH_CLIENT_ID` + `TWITCH_CLIENT_SECRET` set on the bot." };
    const id = await resolveTwitchUser(input);
    return { id, label: id ? `Twitch channel \`${input}\`` : "Couldn't find that Twitch channel." };
  }
  if (!twitterConfigured())
    return { id: null, label: "X/Twitter needs `TWITTER_BEARER_TOKEN` set on the bot." };
  const id = await resolveTwitterUser(input);
  return { id, label: id ? `X account \`@${input.replace(/^@/, "")}\`` : "Couldn't find that X account." };
}

async function addSubscription(
  interaction: Parameters<BotCommand["execute"]>[0],
  type: SubType,
  target: string,
  channelId: string,
  roleId: string | null,
): Promise<string> {
  const prisma = getPrisma();
  if (!prisma) return "Database unavailable.";
  const normalized = target.trim();
  const existing = await prisma.subscription.findUnique({
    where: { guildId_type_target: { guildId: interaction.guildId!, type, target: normalized } },
  });
  if (existing) {
    return `Already subscribed: ${type} \`${normalized}\` → <#${existing.channelId}>. Use \`/notify remove\` first.`;
  }
  const resolved = await resolveTarget(type, normalized);
  await prisma.subscription.create({
    data: {
      guildId: interaction.guildId!,
      channelId,
      type,
      target: normalized,
      targetId: resolved.id,
      roleId,
    },
  });
  if (!resolved.id)
    return `⚠️ Saved, but ${resolved.label} — notifications may not fire until it resolves.`;
  return `🔔 Subscribed to **${type}** \`${normalized}\` — posts go to <#${channelId}>${roleId ? ` pinging <@&${roleId}>` : ""}.\n${resolved.label}`;
}

function subscriptionCommand(type: SubType, description: string): BotCommand {
  return {
    category: "Notifications",
    data: new SlashCommandBuilder()
      .setName(type)
      .setDescription(description)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addStringOption((o) => o.setName("target").setDescription("Channel handle, URL, or username").setRequired(true))
      .addChannelOption((o) => o.setName("channel").setDescription("Where to post (default: here)"))
      .addRoleOption((o) => o.setName("role").setDescription("Role to ping on new posts")),
    async execute(interaction) {
      if (!(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) return;
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const target = interaction.options.getString("target", true);
      const channel = interaction.options.getChannel("channel");
      const role = interaction.options.getRole("role");
      const channelId =
        channel?.id ??
        (interaction.channel && "send" in interaction.channel ? interaction.channelId : null);
      if (!channelId) {
        await interaction.editReply("Pick a channel to post in.");
        return;
      }
      const message = await addSubscription(
        interaction,
        type,
        target,
        channelId,
        role?.id ?? null,
      );
      await interaction.editReply(message);
    },
  };
}

const notifyCommand: BotCommand = {
  category: "Notifications",
  data: new SlashCommandBuilder()
    .setName("notify")
    .setDescription("Manage notification subscriptions")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Subscribe a channel to updates")
        .addStringOption((o) =>
          o
            .setName("type")
            .setDescription("Feed type")
            .setRequired(true)
            .addChoices(
              { name: "youtube", value: "youtube" },
              { name: "twitch", value: "twitch" },
              { name: "twitter", value: "twitter" },
              { name: "roblox", value: "roblox" },
            ),
        )
        .addStringOption((o) => o.setName("target").setDescription("Handle / URL / username").setRequired(true))
        .addChannelOption((o) => o.setName("channel").setDescription("Where to post"))
        .addRoleOption((o) => o.setName("role").setDescription("Role to ping")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Unsubscribe a feed")
        .addStringOption((o) =>
          o
            .setName("type")
            .setDescription("Feed type")
            .setRequired(true)
            .addChoices(
              { name: "youtube", value: "youtube" },
              { name: "twitch", value: "twitch" },
              { name: "twitter", value: "twitter" },
              { name: "roblox", value: "roblox" },
            ),
        )
        .addStringOption((o) => o.setName("target").setDescription("Handle / URL / username").setRequired(true)),
    ),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) return;
    const prisma = getPrisma();
    if (!prisma) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const sub = interaction.options.getSubcommand();
    const type = interaction.options.getString("type", true) as SubType;
    const target = interaction.options.getString("target", true);

    if (sub === "add") {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const channel = interaction.options.getChannel("channel");
      const role = interaction.options.getRole("role");
      const channelId =
        channel?.id ??
        (interaction.channel && "send" in interaction.channel ? interaction.channelId : null);
      if (!channelId) {
        await interaction.editReply("Pick a channel to post in.");
        return;
      }
      await interaction.editReply(
        await addSubscription(interaction, type, target, channelId, role?.id ?? null),
      );
      return;
    }

    const deleted = await prisma.subscription.deleteMany({
      where: { guildId: interaction.guildId!, type, target: target.trim() },
    });
    await interaction.reply({
      content: deleted.count ? "🔕 Subscription removed." : "No matching subscription found.",
      flags: MessageFlags.Ephemeral,
    });
  },
};

const notificationsCommand: BotCommand = {
  category: "Notifications",
  data: new SlashCommandBuilder()
    .setName("notifications")
    .setDescription("List this server's notification subscriptions"),
  async execute(interaction) {
    const prisma = getPrisma();
    if (!prisma) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const subs = await prisma.subscription.findMany({
      where: { guildId: interaction.guildId! },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    if (!subs.length) {
      await interaction.reply({
        content: "No subscriptions yet. Try `/youtube @handle` or `/notify add`.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(ACCENT)
          .setTitle("🔔 Notifications")
          .setDescription(
            subs
              .map(
                (s) =>
                  `**${s.type}** \`${s.target}\` → <#${s.channelId}>${s.roleId ? ` · <@&${s.roleId}>` : ""}${s.enabled ? "" : " (disabled)"}`,
              )
              .join("\n"),
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export const notificationCommands: BotCommand[] = [
  subscriptionCommand("youtube", "Get notified when a YouTube channel uploads"),
  subscriptionCommand("twitch", "Get notified when a Twitch channel goes live"),
  subscriptionCommand("twitter", "Get notified about new posts from an X account"),
  subscriptionCommand("roblox", "Get notified when a Roblox user earns a badge"),
  notifyCommand,
  notificationsCommand,
];
