import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { parseDuration, formatDuration } from "../lib/duration";
import { requirePermission } from "../lib/moderation";
import { shuffle } from "../lib/random";
import type { Giveaway } from "@prisma/client";
import type { BotCommand } from "./types";

const ACCENT = 0x8b7cf8;

export function giveawayEmbed(giveaway: Giveaway): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(giveaway.ended ? 0x555555 : ACCENT)
    .setTitle(`🎉 ${giveaway.prize}`)
    .setDescription(
      giveaway.ended
        ? giveaway.winners.length
          ? `Winners: ${giveaway.winners.map((id) => `<@${id}>`).join(", ")}`
          : "Ended — no valid entries."
        : "Click **Enter** to join! Winners are picked automatically when time runs out.",
    )
    .addFields(
      {
        name: "Ends",
        value: giveaway.ended
          ? `Ended <t:${Math.floor(giveaway.endsAt.getTime() / 1000)}:R>`
          : `<t:${Math.floor(giveaway.endsAt.getTime() / 1000)}:R> (<t:${Math.floor(giveaway.endsAt.getTime() / 1000)}:f>)`,
        inline: true,
      },
      { name: "Winners", value: String(giveaway.winnerCount), inline: true },
      { name: "Entries", value: String(giveaway.entrants.length), inline: true },
      { name: "Hosted by", value: `<@${giveaway.hostId}>`, inline: true },
    )
    .setFooter({ text: `Giveaway ID: ${giveaway.id}` })
    .setTimestamp(giveaway.endsAt);
  return embed;
}

export function giveawayRow(giveaway: Giveaway): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`ga:enter:${giveaway.id}`)
      .setLabel(`Enter (${giveaway.entrants.length})`)
      .setStyle(ButtonStyle.Primary)
      .setEmoji("🎉"),
  );
}

/** Ends a giveaway: picks winners, edits the message. Shared with the scheduler. */
export async function endGiveaway(client: Client, giveaway: Giveaway): Promise<void> {
  const prisma = getPrisma();
  if (!prisma || giveaway.ended) return;
  const winners = shuffle(giveaway.entrants).slice(0, giveaway.winnerCount);
  const updated = await prisma.giveaway.update({
    where: { id: giveaway.id },
    data: { ended: true, winners },
  });
  try {
    const channel = await client.channels.fetch(giveaway.channelId);
    if (!channel || !("messages" in channel)) return;
    const message = giveaway.messageId
      ? await channel.messages.fetch(giveaway.messageId).catch(() => null)
      : null;
    if (message) {
      await message.edit({
        embeds: [giveawayEmbed(updated)],
        components: [],
        content: winners.length
          ? `🏆 Congratulations ${winners.map((id) => `<@${id}>`).join(", ")}! You won **${giveaway.prize}**!`
          : "No valid entries this time.",
      });
    }
  } catch {
    // channel/message gone — giveaway is still marked ended in the database.
  }
}

function extractMessageId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{17,20}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/channels\/\d+\/(\d{17,20})/);
  return match ? match[1] : null;
}

async function findByMessage(messageId: string): Promise<Giveaway | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  return prisma.giveaway.findFirst({ where: { messageId } });
}

const startCommand: BotCommand = {
  category: "Giveaways",
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Run giveaways")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Start a giveaway")
        .addStringOption((o) => o.setName("duration").setDescription("e.g. 10m, 1h, 1d").setRequired(true))
        .addIntegerOption((o) =>
          o.setName("winners").setDescription("Number of winners (default 1)").setMinValue(1).setMaxValue(20),
        )
        .addStringOption((o) => o.setName("prize").setDescription("What are they winning?").setRequired(true))
        .addChannelOption((o) => o.setName("channel").setDescription("Where to host it")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("End a giveaway early")
        .addStringOption((o) => o.setName("message").setDescription("Giveaway message link or ID").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("reroll")
        .setDescription("Pick new winners for an ended giveaway")
        .addStringOption((o) => o.setName("message").setDescription("Giveaway message link or ID").setRequired(true)),
    )
    .addSubcommand((sub) => sub.setName("list").setDescription("List active giveaways")),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const prisma = getPrisma();
    if (!prisma) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === "start") {
      if (!(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) return;
      const durationInput = interaction.options.getString("duration", true);
      const ms = parseDuration(durationInput);
      if (!ms || ms < 10_000) {
        await interaction.reply({
          content: "Give a duration like `10m`, `1h` or `1d` (min 10s).",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const prize = interaction.options.getString("prize", true).slice(0, 256);
      const winnerCount = interaction.options.getInteger("winners") ?? 1;
      const channelOption = interaction.options.getChannel("channel");
      const channel =
        channelOption ??
        (interaction.channel && "send" in interaction.channel ? interaction.channel : null);
      if (!channel || !("send" in channel)) {
        await interaction.reply({ content: "That channel cannot host giveaways.", flags: MessageFlags.Ephemeral });
        return;
      }
      const endsAt = new Date(Date.now() + ms);
      const giveaway = await prisma.giveaway.create({
        data: {
          guildId: interaction.guildId!,
          channelId: channel.id,
          hostId: interaction.user.id,
          prize,
          winnerCount,
          endsAt,
        },
      });
      const message = await channel.send({
        embeds: [giveawayEmbed(giveaway)],
        components: [giveawayRow(giveaway)],
      });
      const updated = await prisma.giveaway.update({
        where: { id: giveaway.id },
        data: { messageId: message.id },
      });
      await interaction.reply({
        content: `🎉 Giveaway started in <#${channel.id}> — ends in **${formatDuration(ms)}**.`,
        flags: MessageFlags.Ephemeral,
      });
      void updated;
      return;
    }

    if (sub === "end" || sub === "reroll") {
      if (!(await requirePermission(interaction, PermissionFlagsBits.ManageGuild))) return;
      const messageId = extractMessageId(interaction.options.getString("message", true));
      if (!messageId) {
        await interaction.reply({ content: "That doesn't look like a message link/ID.", flags: MessageFlags.Ephemeral });
        return;
      }
      const giveaway = await findByMessage(messageId);
      if (!giveaway) {
        await interaction.reply({ content: "No giveaway found for that message.", flags: MessageFlags.Ephemeral });
        return;
      }
      if (sub === "reroll" && !giveaway.ended) {
        await interaction.reply({ content: "That giveaway hasn't ended yet — use `/giveaway end`.", flags: MessageFlags.Ephemeral });
        return;
      }
      if (sub === "reroll") {
        await prisma.giveaway.update({ where: { id: giveaway.id }, data: { ended: false, winners: [] } });
        const fresh = await prisma.giveaway.findUnique({ where: { id: giveaway.id } });
        if (fresh) await endGiveaway(interaction.client, { ...fresh, ended: false });
        const after = await prisma.giveaway.findUnique({ where: { id: giveaway.id } });
        const winners = after?.winners ?? [];
        await interaction.reply({
          content: winners.length
            ? `🔁 New winner(s): ${winners.map((id) => `<@${id}>`).join(", ")}!`
            : "Reroll done — no valid entries.",
        });
        return;
      }
      await endGiveaway(interaction.client, giveaway);
      await interaction.reply({ content: "🏁 Giveaway ended!" });
      return;
    }

    // list
    const active = await prisma.giveaway.findMany({
      where: { guildId: interaction.guildId!, ended: false },
      orderBy: { endsAt: "asc" },
      take: 10,
    });
    if (!active.length) {
      await interaction.reply({ content: "No active giveaways.", flags: MessageFlags.Ephemeral });
      return;
    }
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(ACCENT)
          .setTitle("Active giveaways")
          .setDescription(
            active
              .map(
                (g) =>
                  `**${g.prize}** — ends <t:${Math.floor(g.endsAt.getTime() / 1000)}:R> in <#${g.channelId}> (ID \`${g.id}\`)`,
              )
              .join("\n"),
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export const giveawayCommands: BotCommand[] = [startCommand];
