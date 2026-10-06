import { SlashCommandBuilder } from "discord.js";
import { listCodes } from "@/lib/content";
import { codesEmbed } from "../embeds";
import type { BotCommand } from "./types";

export const codesCommand: BotCommand = {
  category: "Site",
  data: new SlashCommandBuilder()
    .setName("codes")
    .setDescription("Show active Roblox game codes")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Filter by code, reward or game name")
        .setRequired(false),
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString("query")?.trim() ?? "";
    const lowered = query.toLowerCase();
    const now = Date.now();
    const active = (await listCodes()).filter(
      (item) =>
        item.status === "active" &&
        (!item.expiresAt || new Date(item.expiresAt).getTime() > now),
    );
    const matched = (
      lowered
        ? active.filter(
            (item) =>
              item.code.toLowerCase().includes(lowered) ||
              item.reward.toLowerCase().includes(lowered) ||
              (item.gameName ?? "").toLowerCase().includes(lowered),
          )
        : active
    ).slice(0, 20);

    await interaction.editReply({ embeds: [codesEmbed(matched)] });
  },
};
