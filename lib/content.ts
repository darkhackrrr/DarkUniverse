import type { PrismaClient } from "@prisma/client";
import { getPrisma } from "@/lib/database/client";
import { games as seedGames } from "@/lib/data/games";
import { gameCodes as seedCodes } from "@/lib/data/codes";
import { resources as seedResources } from "@/lib/data/resources";
import { announcements as seedAnnouncements } from "@/lib/data/announcements";
import type { Announcement, Game, GameCode, Resource } from "@/types";

/**
 * Content loaders.
 *
 * Static seed files in `lib/data` are the source of truth when no database is
 * configured (and are what the public pages render in demo mode). When
 * `DATABASE_URL` is set, admin edits are written to PostgreSQL and these
 * loaders return those rows instead — matching seed records are replaced so a
 * row created through /admin always wins.
 */

async function safe<T>(
  query: (client: PrismaClient) => Promise<T>,
): Promise<T | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  try {
    return await query(prisma);
  } catch {
    return null;
  }
}

export async function listGames(): Promise<Game[]> {
  const rows = await safe((client) =>
    client.game.findMany({ orderBy: { createdAt: "asc" } }),
  );
  if (!rows) return seedGames;

  const dbGames: Game[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    genre: row.genre,
    status: (["Live", "Beta", "Testing", "Development"].includes(row.status)
      ? row.status
      : "Development") as Game["status"],
    players: row.players,
    robloxUrl: row.robloxUrl,
    thumbUrl: row.thumbUrl,
    universeId: row.universeId,
    featured: row.featured,
  }));

  const bySlug = new Map(dbGames.map((g) => [g.slug, g]));
  const merged = seedGames.map((seed) => bySlug.get(seed.slug) ?? seed);
  const seen = new Set(merged.map((g) => g.slug));
  for (const game of dbGames) {
    if (!seen.has(game.slug)) merged.push(game);
  }
  return merged;
}

export async function getGameBySlug(slug: string): Promise<Game | undefined> {
  const list = await listGames();
  return list.find((game) => game.slug === slug);
}

export async function listCodes(): Promise<GameCode[]> {
  const [rows, gameRows] = await Promise.all([
    safe((client) => client.gameCode.findMany({ orderBy: { createdAt: "asc" } })),
    safe((client) => client.game.findMany({ select: { id: true, slug: true, name: true } })),
  ]);
  if (!rows) return seedCodes;

  const gameById = new Map((gameRows ?? []).map((g) => [g.id, g]));
  const dbCodes: GameCode[] = rows.map((row) => {
    const game = row.gameId ? gameById.get(row.gameId) : undefined;
    return {
      id: row.id,
      code: row.code,
      reward: row.reward,
      status: row.status as GameCode["status"],
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      gameId: row.gameId,
      gameName: game?.name,
      gameSlug: game?.slug,
    };
  });

  const byKey = new Map(dbCodes.map((c) => [c.code, c]));
  const merged = seedCodes.map((seed) => byKey.get(seed.code) ?? seed);
  const seen = new Set(merged.map((c) => c.code));
  for (const code of dbCodes) {
    if (!seen.has(code.code)) merged.push(code);
  }
  return merged;
}

export async function listResources(): Promise<Resource[]> {
  const rows = await safe((client) =>
    client.resource.findMany({ orderBy: { createdAt: "asc" } }),
  );
  if (!rows) return seedResources;

  const dbResources: Resource[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    url: row.url,
    downloadUrl: row.downloadUrl,
    tags: row.tags,
    featured: row.featured,
  }));

  const byId = new Map(dbResources.map((r) => [r.id, r]));
  const merged = seedResources.map((seed) => byId.get(seed.id) ?? seed);
  const seen = new Set(merged.map((r) => r.id));
  for (const resource of dbResources) {
    if (!seen.has(resource.id)) merged.push(resource);
  }
  return merged;
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const rows = await safe((client) =>
    client.announcement.findMany({ orderBy: { publishedAt: "desc" } }),
  );
  if (!rows) return seedAnnouncements;

  const dbRows: Announcement[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    imageUrl: row.imageUrl,
    link: row.link,
    publishedAt: row.publishedAt.toISOString(),
  }));

  const bySlug = new Map(dbRows.map((a) => [a.slug, a]));
  const merged = seedAnnouncements
    .map((seed) => bySlug.get(seed.slug) ?? seed)
    .concat(dbRows.filter((row) => !seedAnnouncements.some((s) => s.slug === row.slug)))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return merged;
}

export async function getAnnouncementBySlug(
  slug: string,
): Promise<Announcement | undefined> {
  const list = await listAnnouncements();
  return list.find((post) => post.slug === slug);
}
