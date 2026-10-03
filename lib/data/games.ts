import type { Game } from "@/types";

/**
 * DarkUniverse Studios game catalogue.
 * Edit this file to add, update or retire games — pages and search pick it up
 * automatically. When a database is configured, DB rows override this list.
 */

export const games: Game[] = [
  {
    id: "g-troll-tower",
    slug: "troll-tower-impossible-obby",
    name: "Troll Tower: Impossible Obby",
    description:
      "Think you can reach the top? Think again. Troll Tower is packed with troll traps, tricky jumps, fake paths, moving obstacles and unexpected surprises. Outsmart the tower, master the obstacles and survive the trolls — only the best obby players reach the finish.",
    genre: "Obby",
    status: "Live",
    players: 0,
    robloxUrl:
      "https://www.roblox.com/games/90003169308914/Troll-Tower-Impossible-Obby",
    universeId: "10766699693",
    featured: true,
  },
];

export function gameBySlug(slug: string): Game | undefined {
  return games.find((g) => g.slug === slug);
}
