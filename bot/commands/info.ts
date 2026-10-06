import { SlashCommandBuilder } from "discord.js";
import { listCodes, listGames, listResources } from "@/lib/content";
import { infoEmbed } from "../embeds";
import type { BotCommand } from "./types";

export const infoCommand: BotCommand = {
  category: "Site",
  data: new SlashCommandBuilder()
    .setName("info")
    .setDescription("About DarkUniverse Hub and where to find things"),
  async execute(interaction) {
    await interaction.deferReply();
    const [games, codes, resources] = await Promise.all([
      listGames(),
      listCodes(),
      listResources(),
    ]);
    await interaction.editReply({
      embeds: [
        infoEmbed({
          games: games.length,
          codes: codes.length,
          resources: resources.length,
        }),
      ],
    });
  },
};
