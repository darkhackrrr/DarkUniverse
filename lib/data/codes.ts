import type { GameCode } from "@/types";
import { games } from "@/lib/data/games";

/**
 * Promo / reward codes. Add a row per code — no other file needs to change.
 *
 * status: "active" | "expired" | "upcoming"
 *
 * Troll Tower: Impossible Obby does not use codes yet, so this list is empty
 * until one is published. Pages render a friendly empty state while it is.
 */

type SeedCode = Omit<GameCode, "id" | "gameName" | "gameSlug"> & {
  gameSlug: string;
};

const seed: SeedCode[] = [];

export const gameCodes: GameCode[] = seed.map((c) => {
  const game = games.find((g) => g.slug === c.gameSlug);
  return {
    ...c,
    id: `c-${c.gameSlug}-${c.code.toLowerCase()}`,
    gameId: game?.id ?? null,
    gameName: game?.name ?? "DarkUniverse",
    gameSlug: c.gameSlug,
  };
});
