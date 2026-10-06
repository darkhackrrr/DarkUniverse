import {
  AttachmentBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type GuildMember,
} from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { getConfig } from "../lib/guildconfig";
import type { Ticket } from "@prisma/client";
import type { BotCommand } from "./types";

const ACCENT = 0x8b7cf8;

function isStaff(member: GuildMember, staffRoleId: string | null): boolean {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (staffRoleId && member.roles.cache.has(staffRoleId)) return true;
  return false;
}

async function findTicketByChannel(guildId: string, channelId: string): Promise<Ticket | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  return prisma.ticket.findFirst({ where: { guildId, channelId } });
}

async function requireTicket(
  interaction: Parameters<BotCommand["execute"]>[0],
): Promise<Ticket | null> {
  const ticket = await findTicketByChannel(interaction.guildId!, interaction.channelId);
  if (!ticket) {
    await interaction.reply({
      content: "Run this inside a ticket channel.",
      flags: MessageFlags.Ephemeral,
    });
    return null;
  }
  return ticket;
}

const ticketCommand: BotCommand = {
  category: "Tickets",
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Support tickets: open, close, manage")
    .addSubcommand((sub) =>
      sub
        .setName("open")
        .setDescription("Open a new support ticket")
        .addStringOption((o) => o.setName("subject").setDescription("What do you need help with?").setMaxLength(200)),
    )
    .addSubcommand((sub) =>
      sub.setName("close").setDescription("Close this ticket (with transcript option)"),
    )
    .addSubcommand((sub) =>
      sub.setName("transcript").setDescription("Export this ticket's recent messages"),
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Give a user access to this ticket")
        .addUserOption((o) => o.setName("user").setDescription("User to add").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Revoke a user's access to this ticket")
        .addUserOption((o) => o.setName("user").setDescription("User to remove").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("rename")
        .setDescription("Rename this ticket channel")
        .addStringOption((o) => o.setName("name").setDescription("New name").setRequired(true).setMaxLength(100)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("category")
        .setDescription("Set where new ticket channels are created")
        .addChannelOption((o) => o.setName("channel").setDescription("Category channel")),
    ),
  async execute(interaction) {
    const prisma = getPrisma();
    const sub = interaction.options.getSubcommand();

    if (sub === "category") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "You need Manage Server.", flags: MessageFlags.Ephemeral });
        return;
      }
      const { patchConfig } = await import("../lib/guildconfig");
      const channel = interaction.options.getChannel("channel");
      await patchConfig(interaction.guildId!, { ticketCategoryId: channel?.id ?? null });
      await interaction.reply(
        channel ? `🎫 New tickets will be created in **${channel.name}**.` : "Ticket category cleared.",
      );
      return;
    }

    if (!prisma) {
      await interaction.reply({ content: "Database unavailable.", flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === "open") {
      const config = await getConfig(interaction.guildId!);
      const existing = await prisma.ticket.findFirst({
        where: { guildId: interaction.guildId!, openerId: interaction.user.id, status: "open" },
      });
      if (existing) {
        await interaction.reply({
          content: `You already have an open ticket: <#${existing.channelId}>`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const count = await prisma.ticket.count({ where: { guildId: interaction.guildId! } });
      const number = count + 1;
      const subject = interaction.options.getString("subject");
      const username = interaction.user.username.replace(/[^a-z0-9-]/gi, "").slice(0, 20) || "user";
      const guild = interaction.guild!;
      const overwrites = [
        { id: guild.roles.everyone.id, deny: ["ViewChannel" as const] },
        { id: interaction.user.id, allow: ["ViewChannel" as const, "SendMessages" as const, "AttachFiles" as const, "ReadMessageHistory" as const] },
      ];
      if (config?.ticketStaffRoleId)
        overwrites.push({
          id: config.ticketStaffRoleId,
          allow: ["ViewChannel" as const, "SendMessages" as const, "AttachFiles" as const, "ReadMessageHistory" as const],
        });
      const channel = await guild.channels.create({
        name: `ticket-${number}-${username}`,
        type: 0,
        parent: config?.ticketCategoryId ?? undefined,
        permissionOverwrites: overwrites,
        reason: `Ticket opened by ${interaction.user.tag}`,
      });
      const ticket = await prisma.ticket.create({
        data: {
          guildId: interaction.guildId!,
          number,
          channelId: channel.id,
          openerId: interaction.user.id,
          subject,
        },
      });
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(ACCENT)
            .setTitle(`🎫 Ticket #${number}`)
            .setDescription(
              `Hey <@${interaction.user.id}>, thanks for reaching out!\n` +
                (subject ? `**Subject:** ${subject}\n` : "") +
                `A staff member will be with you shortly.\n\nUse \`/ticket close\` when you're done.`,
            ),
        ],
      });
      await interaction.reply({
        content: `🎫 Ticket created: <#${ticket.channelId}>`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const ticket = await requireTicket(interaction);
    if (!ticket) return;
    const config = await getConfig(interaction.guildId!);
    const member = interaction.member as GuildMember;
    const canManage =
      isStaff(member, config?.ticketStaffRoleId ?? null) || ticket.openerId === interaction.user.id;

    if (sub === "close") {
      if (!canManage) {
        await interaction.reply({ content: "Only the opener or staff can close tickets.", flags: MessageFlags.Ephemeral });
        return;
      }
      if (ticket.status === "closed") {
        await interaction.reply({ content: "This ticket is already closed.", flags: MessageFlags.Ephemeral });
        return;
      }
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: "closed", closedAt: new Date() },
      });
      const channel = interaction.channel;
      if (channel && "permissionOverwrites" in channel) {
        await (channel as { permissionOverwrites: { edit: (id: string, o: object) => Promise<unknown> } })
          .permissionOverwrites.edit(ticket.openerId, { ViewChannel: false })
          .catch(() => null);
      }
      await interaction.reply(`✅ Ticket #${ticket.number} closed by <@${interaction.user.id}>.`);
      return;
    }

    if (sub === "rename") {
      if (!canManage) {
        await interaction.reply({ content: "Only the opener or staff can rename tickets.", flags: MessageFlags.Ephemeral });
        return;
      }
      const name = interaction.options
        .getString("name", true)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .slice(0, 100);
      const channel = interaction.channel;
      if (!channel || !("setName" in channel)) {
        await interaction.reply({ content: "Cannot rename this channel.", flags: MessageFlags.Ephemeral });
        return;
      }
      await (channel as { setName: (n: string) => Promise<unknown> }).setName(name);
      await interaction.reply(`✏️ Renamed to **#${name}**.`);
      return;
    }

    if (sub === "add" || sub === "remove") {
      if (!isStaff(member, config?.ticketStaffRoleId ?? null)) {
        await interaction.reply({ content: "Only staff can manage ticket access.", flags: MessageFlags.Ephemeral });
        return;
      }
      const user = interaction.options.getUser("user", true);
      const channel = interaction.channel;
      if (!channel || !("permissionOverwrites" in channel)) {
        await interaction.reply({ content: "Cannot manage permissions here.", flags: MessageFlags.Ephemeral });
        return;
      }
      await (channel as { permissionOverwrites: { edit: (id: string, o: object) => Promise<unknown> } })
        .permissionOverwrites.edit(user.id, {
          ViewChannel: sub === "add",
          SendMessages: sub === "add",
          ReadMessageHistory: sub === "add",
        });
      await interaction.reply(
        `${sub === "add" ? "➕ Added" : "➖ Removed"} <@${user.id}> ${sub === "add" ? "to" : "from"} this ticket.`,
      );
      return;
    }

    // transcript
    if (!canManage) {
      await interaction.reply({ content: "Only the opener or staff can export transcripts.", flags: MessageFlags.Ephemeral });
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const channel = interaction.channel;
    if (!channel || !("messages" in channel)) {
      await interaction.editReply("Cannot read messages here.");
      return;
    }
    const messages = await (channel as { messages: { fetch: (o: object) => Promise<Map<string, { content: string; author: { tag: string }; createdAt: Date }>> } })
      .messages.fetch({ limit: 100 })
      .catch(() => new Map());
    const lines = [...messages.values()]
      .reverse()
      .map(
        (m) =>
          `[${m.createdAt.toISOString()}] ${m.author.tag}: ${m.content.replace(/\n/g, "\n  ") || "(attachment/embed)"}`,
      );
    const file = new AttachmentBuilder(
      Buffer.from(
        `Transcript — ticket #${ticket.number} (${interaction.guild!.name})\n` +
          `Exported by ${interaction.user.tag}\n\n${lines.join("\n") || "No messages."}`,
        "utf8",
      ),
      { name: `transcript-ticket-${ticket.number}.txt` },
    );
    await interaction.editReply({ content: "📜 Transcript attached:", files: [file] });
  },
};

export const ticketCommands: BotCommand[] = [ticketCommand];
