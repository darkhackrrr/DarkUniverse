import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} from "discord.js";
import { listGames } from "@/lib/content";
import { env } from "../env";
import { gamesEmbed } from "../embeds";
import type { BotCommand } from "./types";

export const gamesCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("games")
    .setDescription("Browse the DarkUniverse game catalogue")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Filter by name or genre")
        .setRequired(false),
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString("query")?.trim() ?? "";
    const lowered = query.toLowerCase();
    const all = await listGames();
    const matched = (
      lowered
        ? all.filter(
            (game) =>
              game.name.toLowerCase().includes(lowered) ||
              game.genre.toLowerCase().includes(lowered),
          )
        : all
    ).slice(0, 8);

    const buttons = [
      new ButtonBuilder()
        .setLabel("Open catalogue")
        .setURL(`${env.siteUrl}/games`)
        .setStyle(ButtonStyle.Link),
    ];
    if (matched[0]) {
      buttons.push(
        new ButtonBuilder()
          .setLabel(matched[0].name.slice(0, 80))
          .setURL(`${env.siteUrl}/games/${matched[0].slug}`)
          .setStyle(ButtonStyle.Link),
      );
    }
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

    await interaction.editReply({
      embeds: [gamesEmbed(matched, query)],
      components: [row],
    });
  },
};
