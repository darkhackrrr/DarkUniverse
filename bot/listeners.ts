import {
  EmbedBuilder,
  Events,
  PermissionFlagsBits,
  type ButtonInteraction,
  type GuildMember,
  type Guild,
  type Client,
  type Message,
  type MessageReaction,
  type PartialMessageReaction,
  type PartialUser,
  type SelectMenuInteraction,
  type User,
} from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { env } from "./env";
import { getConfig, getReactionRoles, renderTemplate } from "./lib/guildconfig";
import { createCase } from "./lib/moderation";
import { levelFromXp, xpForLevel } from "./lib/xp";
import { giveawayEmbed, giveawayRow } from "./commands/giveaway";
import { fail, info } from "./log";

const XP_COOLDOWN_MS = 60_000;
const INVITE_PATTERN = /(?:discord(?:\.gg|(?:app)?\.com\/invite)\/)[a-zA-Z0-9-]+/i;

const xpCooldowns = new Map<string, number>();

type AnyReaction = MessageReaction | PartialMessageReaction;

async function sendLog(
  client: Client,
  guildId: string,
  embed: EmbedBuilder,
): Promise<void> {
  const config = await getConfig(guildId);
  if (!config?.logsChannelId) return;
  const channel = await client.channels.fetch(config.logsChannelId).catch(() => null);
  if (channel && "send" in channel) {
    await (channel as { send: (o: object) => Promise<unknown> }).send({ embeds: [embed] });
  }
}

async function sendTo(
  channel: { send: (o: object) => Promise<unknown> },
  content: string,
): Promise<void> {
  await channel.send({ content }).catch(() => null);
}

// ── MessageCreate: automod, XP, AFK ─────────────────────────────────────────

async function handleMessage(message: Message): Promise<void> {
  if (!message.guild || message.author.bot || message.webhookId) return;
  const prisma = getPrisma();
  if (!prisma) return;
  const guildId = message.guild.id;
  const config = await getConfig(guildId);
  if (!config) return;
  const member = message.member;
  const channel = message.channel as unknown as { send: (o: object) => Promise<unknown> };

  // automod — moderators with Manage Messages are exempt
  const isModerator = member?.permissions.has(PermissionFlagsBits.ManageMessages); // 1n << 22n
  if (config.automodEnabled && !isModerator) {
    const content = message.content ?? "";
    const lower = content.toLowerCase();
    const violation =
      (config.automodNoInvites && INVITE_PATTERN.test(content) ? "invite link" : null) ??
      (config.automodNoMentions &&
      (content.includes("@everyone") || content.includes("@here") || message.mentions.users.size >= 5)
        ? "mass mention"
        : null) ??
      config.automodBadWords.find((w) => w && lower.includes(w)) ??
      null;
    if (violation) {
      await message.delete().catch(() => null);
      const warning = (await channel
        .send({ content: `🚫 <@${message.author.id}>, that message was removed by automod (${violation}).` })
        .catch(() => null)) as { delete: () => Promise<unknown> } | null;
      if (warning) {
        const timer = setTimeout(() => void warning.delete().catch(() => null), 6_000);
        timer.unref?.();
      }
      await createCase(guildId, "automod", message.author.id, message.client.user?.id ?? "0", String(violation));
      await sendLog(
        message.client,
        guildId,
        new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle("🤖 Automod deletion")
          .setDescription(
            `**User:** ${message.author.tag}\n**Channel:** <#${message.channelId}>\n**Reason:** ${violation}\n**Content:** ${content.slice(0, 400) || "(empty)"}`,
          )
          .setTimestamp(),
      );
      return;
    }
  }

  // AFK — clear own status, or announce someone else's
  if (prisma) {
    const ownAfk = await prisma.afk.findUnique({
      where: { guildId_userId: { guildId, userId: message.author.id } },
    });
    if (ownAfk) {
      await prisma.afk.delete({
        where: { guildId_userId: { guildId, userId: message.author.id } },
      });
      await sendTo(channel, `👋 Welcome back <@${message.author.id}> — your AFK has been cleared.`);
    } else {
      for (const [, user] of message.mentions.users) {
        const afk = await prisma.afk.findUnique({
          where: { guildId_userId: { guildId, userId: user.id } },
        });
        if (afk) {
          await sendTo(channel, `💤 **${user.username}** is AFK: ${afk.reason.slice(0, 150)}`);
          break;
        }
      }
    }
  }

  // XP
  if (!config.xpEnabled || !member || member.user.bot) return;
  const now = Date.now();
  const last = xpCooldowns.get(message.author.id);
  if (last && now - last < XP_COOLDOWN_MS) return;
  if (xpCooldowns.size > 2_000) {
    for (const [key, at] of xpCooldowns) if (now - at > XP_COOLDOWN_MS) xpCooldowns.delete(key);
  }
  xpCooldowns.set(message.author.id, now);

  const profile = await prisma.memberProfile.findUnique({
    where: { guildId_userId: { guildId, userId: message.author.id } },
  });
  const amount = 10 + Math.floor(Math.random() * 16);
  const baseXp = profile?.xp ?? 0;
  const baseLevel = profile?.level ?? 0;
  const xp = baseXp + amount;
  const level = levelFromXp(xp);
  await prisma.memberProfile.upsert({
    where: { guildId_userId: { guildId, userId: message.author.id } },
    create: { guildId, userId: message.author.id, xp, level, messages: 1 },
    update: { xp, level, messages: { increment: 1 } },
  });
  if (level > baseLevel) {
    await sendTo(
      channel,
      `🎉 <@${message.author.id}> reached **level ${level}**! (next at ${xpForLevel(level + 1)} XP)`,
    );
  }
}

// ── Member events: welcome, goodbye, autorole ──────────────────────────────

async function handleMemberJoin(member: GuildMember): Promise<void> {
  const prisma = getPrisma();
  const config = await getConfig(member.guild.id);
  if (config?.autoroleId) {
    await member.roles.add(config.autoroleId).catch(() => null);
  }
  if (prisma) {
    const user = await prisma.user.findUnique({ where: { discordId: member.id } });
    if (user?.isBotVerified) await member.roles.add(env.verifyRoleId).catch(() => null);
  }
  await sendLog(
    member.guild.client,
    member.guild.id,
    new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle("📥 Member joined")
      .setDescription(
        `**${member.user.tag}** (<@${member.user.id}>)\nAccount created <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
      )
      .setTimestamp(),
  );
  if (config?.welcomeChannelId) {
    const channel = await member.guild.channels.fetch(config.welcomeChannelId).catch(() => null);
    if (channel && "send" in channel) {
      const text = renderTemplate(
        config.welcomeMessage ?? "👋 Welcome {user} to **{server}**! You're member #{memberCount}.",
        {
          user: `<@${member.user.id}>`,
          server: member.guild.name,
          memberCount: member.guild.memberCount,
        },
      );
      await sendTo(channel as { send: (o: object) => Promise<unknown> }, text);
    }
  }
}

async function handleMemberLeave(member: GuildMember | { id: string; guild: Guild }): Promise<void> {
  const user = "user" in member ? member.user : null;
  const config = await getConfig(member.guild.id);
  await sendLog(
    member.guild.client,
    member.guild.id,
    new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle("📤 Member left")
      .setDescription(user ? `**${user.tag}** (<@${user.id}>)` : `User <@${member.id}>`)
      .setTimestamp(),
  );
  if (config?.goodbyeChannelId) {
    const channel = await member.guild.channels.fetch(config.goodbyeChannelId).catch(() => null);
    if (channel && "send" in channel) {
      const text = renderTemplate(config.goodbyeMessage ?? "👋 **{user}** left **{server}**.", {
        user: user?.tag ?? member.id,
        server: member.guild.name,
        memberCount: member.guild.memberCount,
      });
      await sendTo(channel as { send: (o: object) => Promise<unknown> }, text);
    }
  }
}

// ── Message logs ────────────────────────────────────────────────────────────

async function handleMessageDelete(message: Message): Promise<void> {
  if (!message.guild || message.author?.bot) return;
  await sendLog(
    message.client,
    message.guild.id,
    new EmbedBuilder()
      .setColor(0x95a5a6)
      .setTitle("🗑️ Message deleted")
      .setDescription(
        `**Author:** ${message.author ? `${message.author.tag}` : "unknown"}\n**Channel:** <#${message.channelId}>\n**Content:** ${(message.content ?? "(not cached)").slice(0, 800)}`,
      )
      .setTimestamp(),
  );
}

async function handleMessageUpdate(oldMessage: Message, newMessage: Message): Promise<void> {
  if (!newMessage.guild || newMessage.author?.bot) return;
  const before = oldMessage.content ?? "";
  const after = newMessage.content ?? "";
  if (!after || before === after) return;
  await sendLog(
    newMessage.client,
    newMessage.guild.id,
    new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("✏️ Message edited")
      .setDescription(
        `**Author:** ${newMessage.author.tag}\n**Channel:** <#${newMessage.channelId}>\n**Before:** ${before.slice(0, 400) || "(not cached)"}\n**After:** ${after.slice(0, 400)}`,
      )
      .setTimestamp(),
  );
}

// ── Reaction roles ──────────────────────────────────────────────────────────

function reactionEmojiKey(reaction: AnyReaction): string {
  return reaction.emoji.id ?? reaction.emoji.name ?? "";
}

async function handleReactionAdd(
  reaction: AnyReaction,
  user: User | PartialUser,
): Promise<void> {
  if (!reaction.message.guildId) return;
  const entries = await getReactionRoles(reaction.message.guildId);
  if (!entries.length) return;
  const key = reactionEmojiKey(reaction);
  const entry = entries.find(
    (e) => e.messageId === reaction.message.id && (e.emoji === key || e.emoji === reaction.emoji.name),
  );
  if (!entry) return;
  const guild = reaction.message.guild;
  if (!guild) return;
  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;
  await member.roles.add(entry.roleId).catch(() => null);
}

async function handleReactionRemove(
  reaction: AnyReaction,
  user: User | PartialUser,
): Promise<void> {
  if (user.bot || !reaction.message.guildId) return;
  const entries = await getReactionRoles(reaction.message.guildId);
  if (!entries.length) return;
  const key = reactionEmojiKey(reaction);
  const entry = entries.find(
    (e) => e.messageId === reaction.message.id && (e.emoji === key || e.emoji === reaction.emoji.name),
  );
  if (!entry) return;
  const guild = reaction.message.guild;
  if (!guild) return;
  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;
  await member.roles.remove(entry.roleId).catch(() => null);
}

// ── Persistent components: giveaways, polls, suggestions ────────────────────

async function handleGiveawayButton(interaction: ButtonInteraction): Promise<void> {
  const prisma = getPrisma();
  const giveawayId = interaction.customId.split(":")[2];
  if (!prisma || !giveawayId) {
    await interaction.reply({ content: "Database unavailable.", ephemeral: true });
    return;
  }
  const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
  if (!giveaway || giveaway.ended) {
    await interaction.reply({ content: "This giveaway has ended.", ephemeral: true });
    return;
  }
  if (giveaway.entrants.includes(interaction.user.id)) {
    await interaction.reply({ content: "You're already entered! 🎉", ephemeral: true });
    return;
  }
  const updated = await prisma.giveaway.update({
    where: { id: giveawayId },
    data: { entrants: { push: interaction.user.id } },
  });
  const message = interaction.message;
  await message
    .edit({ embeds: [giveawayEmbed(updated)], components: [giveawayRow(updated)] })
    .catch(() => null);
  await interaction.reply({ content: "🎉 You're entered! Good luck.", ephemeral: true });
}

async function handlePollSelect(interaction: SelectMenuInteraction): Promise<void> {
  const prisma = getPrisma();
  const pollId = interaction.customId.split(":")[1];
  if (!prisma || !pollId) {
    await interaction.reply({ content: "Database unavailable.", ephemeral: true });
    return;
  }
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll || poll.ended) {
    await interaction.reply({ content: "This poll has ended.", ephemeral: true });
    return;
  }
  const optionIndex = Number(interaction.values[0]);
  const votes = (poll.votes as Record<string, number> | null) ?? {};
  votes[interaction.user.id] = optionIndex;
  await prisma.poll.update({ where: { id: pollId }, data: { votes } });
  await interaction.reply({
    content: `🗳️ Vote recorded for **${poll.options[optionIndex] ?? "?"}** — you can change it anytime.`,
    ephemeral: true,
  });
}

async function handleSuggestionButton(interaction: ButtonInteraction): Promise<void> {
  const prisma = getPrisma();
  const [, suggestionId, action] = interaction.customId.split(":");
  if (!prisma || !suggestionId || !action) {
    await interaction.reply({ content: "Database unavailable.", ephemeral: true });
    return;
  }
  const member = interaction.memberPermissions;
  if (!member?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({ content: "Only staff can handle suggestions.", ephemeral: true });
    return;
  }
  const suggestion = await prisma.suggestion.findUnique({ where: { id: suggestionId } });
  if (!suggestion) {
    await interaction.reply({ content: "Suggestion not found.", ephemeral: true });
    return;
  }
  if (suggestion.status !== "open") {
    await interaction.reply({ content: `Already **${suggestion.status}**.`, ephemeral: true });
    return;
  }
  const status = action === "accepted" ? "accepted" : "denied";
  await prisma.suggestion.update({ where: { id: suggestionId }, data: { status } });
  const color = status === "accepted" ? 0x57f287 : 0xed4245;
  const icon = status === "accepted" ? "✅" : "❌";
  await interaction.message
    .edit({
      embeds: [
        new EmbedBuilder()
          .setColor(color)
          .setTitle(`${icon} Suggestion \`${suggestionId.slice(-6)}\` — ${status}`)
          .setDescription(suggestion.content)
          .setFooter({ text: `Submitted by ${suggestion.userId} · handled by ${interaction.user.tag}` }),
      ],
      components: [],
    })
    .catch(() => null);
  await interaction.reply({ content: `Suggestion **${status}**.`, ephemeral: true });
}

function registerComponentHandlers(client: Client): void {
  client.on(Events.InteractionCreate, (interaction) => {
    const run = async () => {
      if (interaction.isButton() && interaction.customId.startsWith("ga:enter:")) {
        await handleGiveawayButton(interaction);
      } else if (interaction.isStringSelectMenu() && interaction.customId.startsWith("poll:")) {
        await handlePollSelect(interaction);
      } else if (interaction.isButton() && interaction.customId.startsWith("sugg:")) {
        await handleSuggestionButton(interaction);
      }
    };
    run().catch((error) => fail("components", "component interaction failed", error));
  });
}

export function registerListeners(client: Client): void {
  client.on(Events.MessageCreate, (message) => {
    void handleMessage(message).catch((error) => fail("messages", "handler failed", error));
  });
  client.on(Events.MessageDelete, (message) => {
    if (message.inGuild()) {
      void handleMessageDelete(message).catch((error) => fail("logs", "delete log failed", error));
    }
  });
  client.on(Events.MessageUpdate, (oldMessage, newMessage) => {
    if (newMessage.inGuild() && oldMessage.inGuild()) {
      void handleMessageUpdate(oldMessage, newMessage).catch((error) =>
        fail("logs", "update log failed", error),
      );
    }
  });
  client.on(Events.GuildMemberAdd, (member) => {
    void handleMemberJoin(member).catch((error) => fail("members", "join handler failed", error));
  });
  client.on(Events.GuildMemberRemove, (member) => {
    void handleMemberLeave(member).catch((error) => fail("members", "leave handler failed", error));
  });
  client.on(Events.MessageReactionAdd, (reaction, user) => {
    void handleReactionAdd(reaction, user).catch((error) => fail("reaction-roles", "add failed", error));
  });
  client.on(Events.MessageReactionRemove, (reaction, user) => {
    void handleReactionRemove(reaction, user).catch((error) => fail("reaction-roles", "remove failed", error));
  });
  registerComponentHandlers(client);
  info("listeners", "message, member, reaction and component listeners registered");
}
