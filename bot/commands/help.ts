import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { env } from "../env";
import type { BotCommand } from "./types";

export const helpCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List everything this bot can do"),
  async execute(interaction) {
    const { commands } = await import("./index");
    const embed = new EmbedBuilder()
      .setColor(0x8b7cf8)
      .setTitle("DarkUniverse bot commands")
      .setDescription(
        commands
          .map((command) => `**\`/${command.data.name}\`** — ${command.data.description}`)
          .join("\n"),
      )
      .setFooter({ text: `Hub: ${env.siteUrl}` });
    await interaction.reply({ embeds: [embed] });
  },
};
