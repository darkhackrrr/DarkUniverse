import { tools } from "@/lib/tools/registry";
import {
  listAnnouncements,
  listCodes,
  listGames,
  listResources,
} from "@/lib/content";
import type { SearchResult } from "@/types";

/**
 * Fast in-memory search across tools, games, codes, resources and
 * announcements. Data set is small (< 100 records), so a scored scan is both
 * simpler and faster than an index.
 *
 * Catalogue records come from the database when configured (falling back to
 * the built-in seeds), so admin edits are searchable immediately.
 */

function score(query: string, haystacks: Array<string | undefined | null>): number {
  const q = query.toLowerCase();
  let best = 0;
  for (const raw of haystacks) {
    if (!raw) continue;
    const text = raw.toLowerCase();
    if (text === q) best = Math.max(best, 100);
    else if (text.startsWith(q)) best = Math.max(best, 80);
    else if (text.includes(q)) best = Math.max(best, 55);
    else {
      // token match
      const tokens = q.split(/\s+/).filter(Boolean);
      if (tokens.length > 1 && tokens.every((t) => text.includes(t))) {
        best = Math.max(best, 35);
      }
    }
  }
  return best;
}

export async function searchAll(
  query: string,
  limit = 20,
): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const [games, gameCodes, resources, announcements] = await Promise.all([
    listGames(),
    listCodes(),
    listResources(),
    listAnnouncements(),
  ]);

  const results: Array<SearchResult & { _score: number }> = [];

  for (const tool of tools) {
    const s = score(q, [
      tool.name,
      tool.description,
      tool.category,
      tool.slug,
      ...(tool.keywords ?? []),
    ]);
    if (s > 0) {
      results.push({
        id: `tool:${tool.slug}`,
        type: "tool",
        title: tool.name,
        description: tool.description,
        href: tool.href,
        badge: tool.category,
        _score: s + 5,
      });
    }
  }

  for (const game of games) {
    const s = score(q, [game.name, game.description, game.genre, game.slug]);
    if (s > 0) {
      results.push({
        id: `game:${game.slug}`,
        type: "game",
        title: game.name,
        description: game.description,
        href: `/games/${game.slug}`,
        badge: game.genre,
        _score: s + 3,
      });
    }
  }

  for (const code of gameCodes) {
    const s = score(q, [code.code, code.reward, code.gameName ?? ""]);
    if (s > 0) {
      results.push({
        id: `code:${code.id}`,
        type: "code",
        title: code.code,
        description: `${code.reward}${code.gameName ? ` — ${code.gameName}` : ""}`,
        href: `/codes?game=${code.gameSlug ?? ""}&q=${encodeURIComponent(code.code)}`,
        badge: "Code",
        _score: s + (code.status === "active" ? 8 : 0),
      });
    }
  }

  for (const resource of resources) {
    const s = score(q, [
      resource.name,
      resource.description,
      resource.category,
      ...resource.tags,
    ]);
    if (s > 0) {
      results.push({
        id: `resource:${resource.id}`,
        type: "resource",
        title: resource.name,
        description: resource.description,
        href: `/resources?category=${encodeURIComponent(resource.category)}&q=${encodeURIComponent(resource.name)}`,
        badge: resource.category,
        _score: s,
      });
    }
  }

  for (const post of announcements) {
    const s = score(q, [post.title, post.description, post.category]);
    if (s > 0) {
      results.push({
        id: `announcement:${post.slug}`,
        type: "announcement",
        title: post.title,
        description: post.description,
        href: `/updates/${post.slug}`,
        badge: post.category,
        _score: s,
      });
    }
  }

  return results
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...r }) => r);
}

export async function searchSuggestions(query: string): Promise<SearchResult[]> {
  return searchAll(query, 8);
}
