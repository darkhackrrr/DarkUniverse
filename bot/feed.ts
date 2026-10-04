import type { Client } from "discord.js";
import { getPrisma } from "@/lib/database/client";
import type { Announcement, Game, GameCode } from "@/types";
import { resolveSendable, type SendableChannel } from "./channels";
import { env } from "./env";
import { announcementEmbed, codePublishEmbed, gamePublishEmbed } from "./embeds";
import { fail, info } from "./log";
import { readState, writeState } from "./state";

const TICK_MS = 45_000;
const MARKERS = {
  announcements: "feed:announcements",
  gameSubs: "feed:gameSubs",
  codeSubs: "feed:codeSubs",
  games: "feed:games",
  codes: "feed:codes",
} as const;

const APPROVED_FOOTER = "Approved from a community submission";
const ADDED_FOOTER = "Added to the catalogue";

let client: Client | null = null;
let initialized = false;

async function feedChannel(): Promise<SendableChannel | null> {
  if (!client) return null;
  return resolveSendable(client, env.feedChannelId);
}

function toGame(row: {
  id: string;
  slug: string;
  name: string;
  description: string;
  genre: string;
  status: string;
  players: number;
  robloxUrl: string;
  thumbUrl: string | null;
  universeId: string | null;
  featured: boolean;
}): Game {
  const statuses = ["Live", "Beta", "Testing", "Development"];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    genre: row.genre,
    status: statuses.includes(row.status)
      ? (row.status as Game["status"])
      : "Development",
    players: row.players,
    robloxUrl: row.robloxUrl,
    thumbUrl: row.thumbUrl,
    universeId: row.universeId,
    featured: row.featured,
  };
}

function toGameCode(row: {
  id: string;
  code: string;
  reward: string;
  status: string;
  expiresAt: Date | null;
  gameId: string | null;
}): GameCode {
  return {
    id: row.id,
    code: row.code,
    reward: row.reward,
    status: row.status as GameCode["status"],
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    gameId: row.gameId,
  };
}

async function initMarkers(): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  const [announcement, gameSub, codeSub, game, code] = await Promise.all([
    prisma.announcement.findFirst({ orderBy: { publishedAt: "desc" } }),
    prisma.gameSubmission.findFirst({
      where: { status: "approved", reviewedAt: { not: null } },
      orderBy: { reviewedAt: "desc" },
    }),
    prisma.codeSubmission.findFirst({
      where: { status: "approved", reviewedAt: { not: null } },
      orderBy: { reviewedAt: "desc" },
    }),
    prisma.game.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.gameCode.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  const seeds: [string, Date | null][] = [
    [MARKERS.announcements, announcement?.publishedAt ?? null],
    [MARKERS.gameSubs, gameSub?.reviewedAt ?? null],
    [MARKERS.codeSubs, codeSub?.reviewedAt ?? null],
    [MARKERS.games, game?.createdAt ?? null],
    [MARKERS.codes, code?.createdAt ?? null],
  ];
  for (const [key, date] of seeds) {
    if (!(await readState(key))) {
      await writeState(key, (date ?? new Date()).toISOString());
    }
  }
}

async function feedAnnouncements(channel: SendableChannel): Promise<number> {
  const prisma = getPrisma();
  if (!prisma) return 0;
  const marker = await readState(MARKERS.announcements);
  if (!marker) return 0;

  const rows = await prisma.announcement.findMany({
    where: { publishedAt: { gt: new Date(marker) } },
    orderBy: { publishedAt: "asc" },
  });

  let posted = 0;
  for (const row of rows) {
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
    await channel.send({ embeds: [announcementEmbed(payload)] });
    await writeState(MARKERS.announcements, row.publishedAt.toISOString());
    posted += 1;
  }
  return posted;
}

async function feedApprovedSubmissions(channel: SendableChannel): Promise<number> {
  const prisma = getPrisma();
  if (!prisma) return 0;

  let posted = 0;

  const gameMarker = await readState(MARKERS.gameSubs);
  if (gameMarker) {
    const rows = await prisma.gameSubmission.findMany({
      where: { status: "approved", reviewedAt: { gt: new Date(gameMarker) } },
      orderBy: { reviewedAt: "asc" },
    });
    for (const row of rows) {
      if (row.gameId) {
        const game = await prisma.game.findUnique({ where: { id: row.gameId } });
        if (game) {
          await channel.send({ embeds: [gamePublishEmbed(toGame(game), APPROVED_FOOTER)] });
          posted += 1;
        }
      }
      await writeState(MARKERS.gameSubs, (row.reviewedAt ?? new Date()).toISOString());
    }
  }

  const codeMarker = await readState(MARKERS.codeSubs);
  if (codeMarker) {
    const rows = await prisma.codeSubmission.findMany({
      where: { status: "approved", reviewedAt: { gt: new Date(codeMarker) } },
      orderBy: { reviewedAt: "asc" },
    });
    for (const row of rows) {
      if (row.codeId) {
        const gameCode = await prisma.gameCode.findUnique({
          where: { id: row.codeId },
        });
        if (gameCode) {
          const game = gameCode.gameId
            ? await prisma.game.findUnique({ where: { id: gameCode.gameId } })
            : null;
          await channel.send({
            embeds: [
              codePublishEmbed(
                toGameCode(gameCode),
                game?.name ?? row.gameName ?? null,
                APPROVED_FOOTER,
                row.reviewedAt,
              ),
            ],
          });
          posted += 1;
        }
      }
      await writeState(MARKERS.codeSubs, (row.reviewedAt ?? new Date()).toISOString());
    }
  }

  return posted;
}

async function feedDirectContent(channel: SendableChannel): Promise<number> {
  const prisma = getPrisma();
  if (!prisma) return 0;

  let posted = 0;

  const gameMarker = await readState(MARKERS.games);
  if (gameMarker) {
    const rows = await prisma.game.findMany({
      where: { createdAt: { gt: new Date(gameMarker) } },
      orderBy: { createdAt: "asc" },
    });
    for (const row of rows) {
      const viaSubmission = await prisma.gameSubmission.findFirst({
        where: { gameId: row.id },
        select: { id: true },
      });
      if (!viaSubmission) {
        await channel.send({ embeds: [gamePublishEmbed(toGame(row), ADDED_FOOTER)] });
        posted += 1;
      }
      await writeState(MARKERS.games, row.createdAt.toISOString());
    }
  }

  const codeMarker = await readState(MARKERS.codes);
  if (codeMarker) {
    const rows = await prisma.gameCode.findMany({
      where: { createdAt: { gt: new Date(codeMarker) } },
      orderBy: { createdAt: "asc" },
    });
    for (const row of rows) {
      const viaSubmission = await prisma.codeSubmission.findFirst({
        where: { codeId: row.id },
        select: { id: true },
      });
      if (!viaSubmission) {
        const game = row.gameId
          ? await prisma.game.findUnique({ where: { id: row.gameId } })
          : null;
        await channel.send({
          embeds: [
            codePublishEmbed(
              toGameCode(row),
              game?.name ?? null,
              ADDED_FOOTER,
              row.createdAt,
            ),
          ],
        });
        posted += 1;
      }
      await writeState(MARKERS.codes, row.createdAt.toISOString());
    }
  }

  return posted;
}

async function tick(): Promise<void> {
  if (!getPrisma()) return;
  try {
    if (!initialized) {
      await initMarkers();
      initialized = true;
      info("feed", "markers initialised");
    }
    const channel = await feedChannel();
    if (!channel) {
      warnOnce("feed");
      return;
    }
    const posted =
      (await feedAnnouncements(channel)) +
      (await feedApprovedSubmissions(channel)) +
      (await feedDirectContent(channel));
    if (posted > 0) info("feed", `posted ${posted} item(s)`);
  } catch (error) {
    fail("feed", "tick failed", error);
  }
}

let warnedMissingChannel = false;
function warnOnce(tag: string): void {
  if (warnedMissingChannel) return;
  warnedMissingChannel = true;
  fail(tag, "feed channel is missing or not a text channel");
}

export function startFeed(botClient: Client): void {
  client = botClient;
  void tick();
  const timer = setInterval(() => void tick(), TICK_MS);
  timer.unref?.();
}
