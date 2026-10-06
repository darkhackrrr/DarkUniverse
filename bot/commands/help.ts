import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { env } from "../env";
import type { BotCommand, CommandCategory } from "./types";

const ACCENT = 0x8b7cf8;

export const helpCommand: BotCommand = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List everything this bot can do")
    .addStringOption((option) =>
      option.setName("command").setDescription("Explain a specific command"),
    ),
  async execute(interaction) {
    const { commands } = await import("./index");
    const query = interaction.options
      .getString("command")
      ?.toLowerCase()
      .replace(/^\//, "")
      .trim();

    if (query) {
      const found = commands.find((command) => command.data.toJSON().name === query);
      if (!found) {
        await interaction.reply({
          content: `No command named \`/${query}\`. Use \`/help\` to see them all.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      const json = found.data.toJSON();
      const embed = new EmbedBuilder()
        .setColor(ACCENT)
        .setTitle(`/${json.name}`)
        .setDescription(json.description)
        .setFooter({ text: `Category: ${found.category}` });
      await interaction.reply({ embeds: [embed] });
      return;
    }

    const grouped = new Map<CommandCategory, string[]>();
    for (const command of commands) {
      const { name } = command.data.toJSON();
      const list = grouped.get(command.category) ?? [];
      list.push(name);
      grouped.set(command.category, list);
    }

    const lines = [...grouped.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([category, names]) =>
          `**${category}** — ${names
            .sort()
            .map((name) => `\`/${name}\``)
            .join(" ")}`,
      );

    const embed = new EmbedBuilder()
      .setColor(ACCENT)
      .setTitle("DarkUniverse bot commands")
      .setDescription(lines.join("\n"))
      .setFooter({ text: `Use /help <command> for details · ${env.siteUrl}` });
    await interaction.reply({ embeds: [embed] });
  },
};
