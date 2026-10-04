import { EmbedBuilder } from "discord.js";
import { env } from "./env";
import type { Announcement, Game, GameCode } from "@/types";

const BRAND = 0x8b7cf8;
const GREEN = 0x2ecc71;
const RED = 0xed4245;

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function announcementEmbed(a: Announcement): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(BRAND)
    .setTitle(clip(a.title, 256))
    .setURL(`${env.siteUrl}/updates/${a.slug}`)
    .setDescription(clip(a.description, 3800))
    .addFields({ name: "Category", value: a.category || "Other", inline: true })
    .setFooter({ text: "DarkUniverse Hub · New update" })
    .setTimestamp(new Date(a.publishedAt));
  if (a.imageUrl) embed.setThumbnail(a.imageUrl);
  if (a.link) embed.addFields({ name: "Link", value: clip(a.link, 1024) });
  return embed;
}

export function gamesEmbed(list: Game[], query: string): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(BRAND);
  embed.setTitle(
    query ? `Games matching "${clip(query, 80)}"` : "DarkUniverse games",
  );
  if (list.length === 0) {
    embed.setDescription("No games matched that search.");
  } else {
    const lines = list.map((game) => {
      const head = `**[${game.name}](${env.siteUrl}/games/${game.slug})**`;
      const meta = `${game.genre} · ${game.status}`;
      return `${head} — ${meta}\n${clip(game.description, 140)}`;
    });
    embed.setDescription(clip(lines.join("\n\n"), 4000));
  }
  embed.setFooter({ text: `${list.length} shown · ${env.siteUrl.replace("https://", "")}` });
  return embed;
}

export function codesEmbed(list: GameCode[]): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(BRAND)
    .setTitle("Active game codes");
  if (list.length === 0) {
    embed.setDescription("No active codes right now — check back soon.");
  } else {
    embed.addFields(
      list.slice(0, 20).map((item) => ({
        name: clip(item.code, 256),
        value: clip(
          `${item.reward}${item.gameName ? ` · ${item.gameName}` : ""}`,
          1024,
        ),
        inline: true,
      })),
    );
  }
  embed.setFooter({ text: `Full list: ${env.siteUrl}/codes` });
  return embed;
}

export function infoEmbed(stats: {
  games: number;
  codes: number;
  resources: number;
}): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(BRAND)
    .setTitle("DarkUniverse Hub")
    .setURL(env.siteUrl)
    .setDescription(
      "Tools, resources & experiences for the DarkUniverse community — built by DarkUniverse Studios.",
    )
    .addFields(
      { name: "Games", value: `[${stats.games} in the catalogue](${env.siteUrl}/games)`, inline: true },
      { name: "Codes", value: `[${stats.codes} active](${env.siteUrl}/codes)`, inline: true },
      { name: "Tools", value: `[Browse tools](${env.siteUrl}/tools)`, inline: true },
      { name: "Resources", value: `[${stats.resources} free resources](${env.siteUrl}/resources)`, inline: true },
      { name: "Updates", value: `[Latest news](${env.siteUrl}/updates)`, inline: true },
      { name: "Community", value: `[Join in](${env.siteUrl}/community)`, inline: true },
    )
    .setFooter({ text: "DarkUniverse Studios" })
    .setTimestamp();
}

export function gamePublishEmbed(game: Game, footer: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(GREEN)
    .setTitle(`New game: ${clip(game.name, 200)}`)
    .setURL(`${env.siteUrl}/games/${game.slug}`)
    .setDescription(clip(game.description, 400))
    .addFields(
      { name: "Genre", value: game.genre, inline: true },
      { name: "Status", value: game.status, inline: true },
    )
    .setFooter({ text: footer })
    .setTimestamp();
  if (game.thumbUrl) embed.setThumbnail(game.thumbUrl);
  return embed;
}

export function codePublishEmbed(
  code: GameCode,
  gameName: string | null,
  footer: string,
  date: Date | null,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(GREEN)
    .setTitle(`New code: ${clip(code.code, 200)}`)
    .setURL(`${env.siteUrl}/codes`)
    .setDescription(clip(code.reward, 400))
    .addFields({
      name: "Game",
      value: gameName ?? "General",
      inline: true,
    })
    .setFooter({ text: footer })
    .setTimestamp(date);
}

export function pendingAlertEmbed(
  entries: { label: string; detail: string }[],
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(RED)
    .setTitle(`Pending submission${entries.length === 1 ? "" : "s"} to review`)
    .setDescription(
      clip(
        entries.map((entry) => `• **${entry.label}** — ${entry.detail}`).join("\n"),
        3800,
      ),
    )
    .setURL(`${env.siteUrl}/admin/submissions`)
    .setFooter({ text: "Review at /admin/submissions" })
    .setTimestamp();
}

export function statusEmbed(
  kind: "down" | "recovered",
  detail: string,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(kind === "down" ? RED : GREEN)
    .setTitle(kind === "down" ? "⚠ Site unreachable" : "✅ Site recovered")
    .setDescription(clip(detail, 400))
    .setURL(env.siteUrl)
    .setTimestamp();
}
