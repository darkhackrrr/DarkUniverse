import type { Metadata } from "next";
import { Gamepad2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { guardUser } from "@/lib/auth/guards";
import { listGames } from "@/lib/content";
import { GameCatalogue } from "@/components/dashboard/game-catalogue";

export const metadata: Metadata = {
  title: "Games",
  robots: { index: false },
};

export default async function DashboardGamesPage() {
  await guardUser("/dashboard/games");
  const games = await listGames();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="size-4 text-primary" /> Games you follow
        </CardTitle>
        <CardDescription>
          {games.length} titles in the DarkUniverse catalogue. Live counts are
          read from Roblox when you request them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GameCatalogue
          games={games.map((game) => ({
            slug: game.slug,
            name: game.name,
            genre: game.genre,
            status: game.status,
            players: game.players,
            universeId: game.universeId ?? null,
            robloxUrl: game.robloxUrl,
          }))}
        />
      </CardContent>
    </Card>
  );
}
