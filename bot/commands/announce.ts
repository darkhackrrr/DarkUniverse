import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { announcementCategories } from "@/lib/config";
import type { Announcement } from "@/types";
import { resolveSendable } from "../channels";
import { env } from "../env";
import { announcementEmbed } from "../embeds";
import { writeState } from "../state";
import type { BotCommand } from "./types";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const announceCommand: BotCommand = {
  category: "Server",
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Publish an announcement to the site and #announcements (admin)")
    .addStringOption((option) =>
      option.setName("title").setDescription("Announcement title").setRequired(true).setMaxLength(120),
    )
    .addStringOption((option) =>
      option.setName("body").setDescription("Announcement body").setRequired(true).setMaxLength(3500),
    )
    .addStringOption((option) =>
      option.setName("link").setDescription("Optional URL").setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Category (defaults to Other)")
        .setRequired(false)
        .addChoices(
          announcementCategories.map((category) => ({
            name: category,
            value: category,
          })),
        ),
    ),
  async execute(interaction) {
    const reply = async (content: string) => {
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    };

    if (!env.adminDiscordIds.includes(interaction.user.id)) {
      await reply("Only DarkUniverse Hub admins can publish announcements.");
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const prisma = getPrisma();
    if (!prisma) {
      await interaction.editReply("The database is not configured.");
      return;
    }

    const title = interaction.options.getString("title", true).trim();
    const body = interaction.options.getString("body", true).trim();
    const link = interaction.options.getString("link")?.trim() || null;
    const category =
      interaction.options.getString("category") ??
      announcementCategories[announcementCategories.length - 1];

    const base = slugify(title) || "announcement";
    let slug = base;
    for (let suffix = 2; suffix < 100; suffix += 1) {
      const existing = await prisma.announcement.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${base}-${suffix}`;
    }

    try {
      const row = await prisma.announcement.create({
        data: { slug, title, description: body, category, link },
      });

      await writeState("feed:announcements", row.publishedAt.toISOString());

      const payload: Announcement = {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        category: row.category,
        imageUrl: row.imageUrl,
        link: row.link,
        publishedAt: row.publishedAt.toISOString(),
      };

      const channel = await resolveSendable(interaction.client, env.feedChannelId);
      if (channel) {
        await channel.send({ embeds: [announcementEmbed(payload)] });
      }

      const actor = await prisma.user.findUnique({
        where: { discordId: interaction.user.id },
        select: { id: true },
      });
      await prisma.activity.create({
        data: {
          type: "admin",
          message: `Announcement "${title}" published via Discord`,
          userId: actor?.id ?? null,
        },
      });

      await interaction.editReply(
        `Published: **${title}** → ${env.siteUrl}/updates/${row.slug}`,
      );
    } catch (error) {
      console.error("[announce] failed", error);
      await interaction.editReply("Could not publish the announcement.");
    }
  },
};
