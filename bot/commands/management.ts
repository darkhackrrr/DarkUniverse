import {
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { getPrisma } from "@/lib/database/client";
import {
  getConfig,
  getReactionRoles,
  patchConfig,
  setReactionRoles,
  type ReactionRoleEntry,
} from "../lib/guildconfig";
import { requirePermission } from "../lib/moderation";
import type { BotCommand } from "./types";

const ACCENT = 0x8b7cf8;

function embed(title: string, description?: string) {
  const e = new EmbedBuilder().setColor(ACCENT).setTitle(title);
  if (description) e.setDescription(description);
  return e;
}

function yesNo(value: boolean): string {
  return value ? "✅ on" : "❌ off";
}

const setupCommand: BotCommand = {
  category: "Server",
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Initialize the bot for this server and show the setup checklist"),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) return;
    const config = await getConfig(interaction.guildId!);
    if (!config) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    await interaction.reply({
      embeds: [
        embed(`🛠️ Setup checklist — ${interaction.guild!.name}`)
          .setDescription("Configure everything with these commands:")
          .addFields(
            { name: "Welcome", value: `/setwelcome <channel> [message]` },
            { name: "Goodbye", value: `/goodbye <channel> [message]` },
            { name: "Rules", value: `/setrules <channel>` },
            { name: "Logs", value: `/setlogs <channel>` },
            { name: "Auto-role", value: `/autorole <role>` },
            { name: "Reaction roles", value: `/reactionrole create <channel> <emoji> <role> [text]` },
            { name: "Automod", value: "/automod on or /automod word-add <word>" },
            { name: "Tickets", value: `/ticket category <channel> — see /ticket` },
            { name: "Verify", value: `Members run \`/verify <code>\` from the dashboard.` },
          )
          .setFooter({ text: "Use /config to review the current settings." }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

const configCommand: BotCommand = {
  category: "Server",
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Show the current bot configuration for this server"),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) return;
    const config = await getConfig(interaction.guildId!);
    if (!config) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const reactionRoles = await getReactionRoles(interaction.guildId!);
    await interaction.reply({
      embeds: [
        embed(`⚙️ Configuration — ${interaction.guild!.name}`).addFields(
          { name: "Welcome", value: config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : "Not set", inline: true },
          { name: "Goodbye", value: config.goodbyeChannelId ? `<#${config.goodbyeChannelId}>` : "Not set", inline: true },
          { name: "Logs", value: config.logsChannelId ? `<#${config.logsChannelId}>` : "Not set", inline: true },
          { name: "Rules", value: config.rulesChannelId ? `<#${config.rulesChannelId}>` : "Not set", inline: true },
          { name: "Auto-role", value: config.autoroleId ? `<@&${config.autoroleId}>` : "Not set", inline: true },
          { name: "XP", value: yesNo(config.xpEnabled), inline: true },
          { name: "Automod", value: yesNo(config.automodEnabled), inline: true },
          { name: "Invites filter", value: yesNo(config.automodNoInvites), inline: true },
          { name: "Mention filter", value: yesNo(config.automodNoMentions), inline: true },
          { name: "Bad words", value: config.automodBadWords.length ? config.automodBadWords.length + " word(s)" : "None", inline: true },
          { name: "Reaction roles", value: String(reactionRoles.length), inline: true },
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

const autoroleCommand: BotCommand = {
  category: "Server",
  data: new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("Set the role new members get automatically")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption((o) => o.setName("role").setDescription("Role to grant on join (omit to disable)")),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageRoles))) return;
    const role = interaction.options.getRole("role");
    if (role && role.managed) {
      await interaction.reply({ content: "That role is managed.", flags: MessageFlags.Ephemeral });
      return;
    }
    await patchConfig(interaction.guildId!, { autoroleId: role?.id ?? null });
    await interaction.reply(
      role ? `🤝 New members will receive **${role.name}**.` : "Auto-role disabled.",
    );
  },
};

function channelMessageCommand(
  name: "welcome" | "goodbye",
  describe: string,
): BotCommand {
  return {
    category: "Server",
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription(describe)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addChannelOption((o) => o.setName("channel").setDescription("Channel to post in"))
      .addStringOption((o) =>
        o
          .setName("message")
          .setDescription("Template — {user}, {server}, {memberCount} are replaced")
          .setMaxLength(500),
      ),
    async execute(interaction) {
      if (!(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) return;
      const channel = interaction.options.getChannel("channel");
      const message = interaction.options.getString("message");
      const config = await getConfig(interaction.guildId!);
      const channelIdKey = name === "welcome" ? "welcomeChannelId" : "goodbyeChannelId";
      const messageKey = name === "welcome" ? "welcomeMessage" : "goodbyeMessage";
      const updates: Record<string, string | null> = {};
      if (channel) updates[channelIdKey] = channel.id;
      if (message !== null) updates[messageKey] = message;
      if (Object.keys(updates).length) await patchConfig(interaction.guildId!, updates);
      const currentChannel = name === "welcome" ? config?.welcomeChannelId : config?.goodbyeChannelId;
      const currentMessage = name === "welcome" ? config?.welcomeMessage : config?.goodbyeMessage;
      await interaction.reply({
        embeds: [
          embed(
            `${name === "welcome" ? "👋 Welcome" : "👋 Goodbye"} settings`,
            `Channel: ${currentChannel ? `<#${currentChannel}>` : "not set"}\n` +
              `Message: ${currentMessage ? `\`${currentMessage}\`` : "default"}`,
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    },
  };
}

const setwelcomeCommand: BotCommand = {
  category: "Server",
  data: new SlashCommandBuilder()
    .setName("setwelcome")
    .setDescription("Set the welcome channel and message in one go")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName("channel").setDescription("Channel").setRequired(true))
    .addStringOption((o) =>
      o
        .setName("message")
        .setDescription("Template — {user}, {server}, {memberCount}")
        .setMaxLength(500),
    ),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) return;
    const channel = interaction.options.getChannel("channel", true);
    const message = interaction.options.getString("message");
    await patchConfig(interaction.guildId!, {
      welcomeChannelId: channel.id,
      ...(message ? { welcomeMessage: message } : {}),
    });
    await interaction.reply(`👋 Welcome messages will go to <#${channel.id}>.`);
  },
};

const setrulesCommand: BotCommand = {
  category: "Server",
  data: new SlashCommandBuilder()
    .setName("setrules")
    .setDescription("Set the rules channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName("channel").setDescription("Rules channel").setRequired(true)),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) return;
    const channel = interaction.options.getChannel("channel", true);
    await patchConfig(interaction.guildId!, { rulesChannelId: channel.id });
    await interaction.reply(`📜 Rules channel set to <#${channel.id}>.`);
  },
};

const logsCommand: BotCommand = {
  category: "Server",
  data: new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Show the logging status for this server"),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) return;
    const config = await getConfig(interaction.guildId!);
    await interaction.reply({
      embeds: [
        embed(
          "📑 Logging status",
          `Channel: ${config?.logsChannelId ? `<#${config.logsChannelId}>` : "not set"}\n\n` +
            "Logged events: message deletes, message edits, member joins, member leaves.\n" +
            "Use `/setlogs <channel>` to change it, `/setlogs disable` to turn it off.",
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

const setlogsCommand: BotCommand = {
  category: "Server",
  data: new SlashCommandBuilder()
    .setName("setlogs")
    .setDescription("Set (or disable) the log channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName("channel").setDescription("Channel for event logs"))
    .addBooleanOption((o) => o.setName("disable").setDescription("Turn logging off entirely")),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) return;
    const channel = interaction.options.getChannel("channel");
    const disable = interaction.options.getBoolean("disable");
    if (disable || !channel) {
      await patchConfig(interaction.guildId!, { logsChannelId: null });
      await interaction.reply("📑 Logging disabled.");
      return;
    }
    await patchConfig(interaction.guildId!, { logsChannelId: channel.id });
    await interaction.reply(`📑 Logs will be posted to <#${channel.id}>.`);
  },
};

function parseEmojiInput(input: string): string {
  const custom = input.match(/^<a?:(\w+):(\d{17,20})>$/);
  return custom ? custom[2] : input.trim();
}

const reactionroleCommand: BotCommand = {
  category: "Server",
  data: new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Reaction roles: react to get a role")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Post a message and assign a role on reaction")
        .addChannelOption((o) => o.setName("channel").setDescription("Where to post").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji to react with").setRequired(true))
        .addRoleOption((o) => o.setName("role").setDescription("Role to grant").setRequired(true))
        .addStringOption((o) => o.setName("text").setDescription("Message text").setMaxLength(300)),
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("List configured reaction roles"))
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a reaction role")
        .addStringOption((o) => o.setName("message").setDescription("Message ID").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji").setRequired(true)),
    ),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageRoles))) return;
    const prisma = getPrisma();
    if (!prisma) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const sub = interaction.options.getSubcommand();
    const entries = await getReactionRoles(interaction.guildId!);

    if (sub === "create") {
      const channel = interaction.options.getChannel("channel", true);
      const emojiInput = parseEmojiInput(interaction.options.getString("emoji", true));
      const role = interaction.options.getRole("role", true);
      const text = interaction.options.getString("text") ?? "React below to get a role!";
      if (!("send" in channel)) {
        await interaction.reply({ content: "That channel cannot send messages.", flags: MessageFlags.Ephemeral });
        return;
      }
      const message = await (channel as { send: (o: object) => Promise<import("discord.js").Message> }).send({
        content: text,
      });
      await message.react(emojiInput).catch(() => null);
      const next: ReactionRoleEntry[] = [
        ...entries,
        { channelId: channel.id, messageId: message.id, emoji: emojiInput, roleId: role.id },
      ];
      await setReactionRoles(interaction.guildId!, next);
      await interaction.reply(`✅ Reaction role live in <#${channel.id}> — react to get **${role.name}**.`);
      return;
    }

    if (sub === "list") {
      await interaction.reply({
        embeds: [
          embed(
            "Reaction roles",
            entries.length
              ? entries
                  .map((e) => `Message \`${e.messageId}\` in <#${e.channelId}> → <@&${e.roleId}> (emoji \`${e.emoji}\`)`)
                  .join("\n")
              : "None configured.",
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // remove
    const messageId = interaction.options.getString("message", true).trim();
    const emoji = parseEmojiInput(interaction.options.getString("emoji", true));
    const next = entries.filter((e) => !(e.messageId === messageId && e.emoji === emoji));
    if (next.length === entries.length) {
      await interaction.reply({ content: "No matching reaction role found.", flags: MessageFlags.Ephemeral });
      return;
    }
    await setReactionRoles(interaction.guildId!, next);
    await interaction.reply("🗑️ Reaction role removed.");
  },
};

const automodCommand: BotCommand = {
  category: "Server",
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Automatic moderation (invites, mentions, bad words)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) => sub.setName("on").setDescription("Enable automod"))
    .addSubcommand((sub) => sub.setName("off").setDescription("Disable automod"))
    .addSubcommand((sub) => sub.setName("status").setDescription("Show automod status"))
    .addSubcommand((sub) =>
      sub
        .setName("word-add")
        .setDescription("Add a blocked word")
        .addStringOption((o) => o.setName("word").setDescription("Word to block").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("word-remove")
        .setDescription("Remove a blocked word")
        .addStringOption((o) => o.setName("word").setDescription("Word to unblock").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub.setName("invites").setDescription("Toggle Discord invite filtering"),
    )
    .addSubcommand((sub) =>
      sub.setName("mentions").setDescription("Toggle mass-mention filtering"),
    ),
  async execute(interaction) {
    if (!(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) return;
    const prisma = getPrisma();
    if (!prisma) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }
    const sub = interaction.options.getSubcommand();
    const config = await getConfig(interaction.guildId!);

    if (sub === "on" || sub === "off") {
      await patchConfig(interaction.guildId!, { automodEnabled: sub === "on" });
      await interaction.reply(`Automod is now **${sub === "on" ? "enabled" : "disabled"}**.`);
      return;
    }
    if (sub === "invites" || sub === "mentions") {
      const value =
        sub === "invites" ? !config?.automodNoInvites : !config?.automodNoMentions;
      await patchConfig(
        interaction.guildId!,
        sub === "invites" ? { automodNoInvites: value } : { automodNoMentions: value },
      );
      await interaction.reply(`${sub === "invites" ? "Invite" : "Mention"} filter is now **${value ? "on" : "off"}**.`);
      return;
    }
    if (sub === "word-add" || sub === "word-remove") {
      const word = interaction.options.getString("word", true).trim().toLowerCase();
      const current = new Set(config?.automodBadWords ?? []);
      if (sub === "word-add") current.add(word);
      else current.delete(word);
      await patchConfig(interaction.guildId!, { automodBadWords: [...current] });
      await interaction.reply(
        `${sub === "word-add" ? "➕ Added" : "➖ Removed"} \`${word}\` (${current.size} blocked word(s)).`,
      );
      return;
    }
    await interaction.reply({
      embeds: [
        embed(
          "🤖 Automod status",
          `Enabled: **${yesNo(Boolean(config?.automodEnabled))}**\n` +
            `Invite filter: **${yesNo(Boolean(config?.automodNoInvites))}**\n` +
            `Mention filter: **${yesNo(Boolean(config?.automodNoMentions))}**\n` +
            `Blocked words: **${config?.automodBadWords.length ?? 0}**`,
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export const managementCommands: BotCommand[] = [
  setupCommand,
  configCommand,
  autoroleCommand,
  channelMessageCommand("welcome", "Show or set the welcome message"),
  channelMessageCommand("goodbye", "Show or set the goodbye message"),
  logsCommand,
  setlogsCommand,
  setwelcomeCommand,
  setrulesCommand,
  reactionroleCommand,
  automodCommand,
];
