import type { Metadata } from "next";
import Link from "next/link";
import { Users, ExternalLink, Sparkles } from "lucide-react";
import { PageHeader, ContentSection } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitGameForm } from "@/components/submit-game-form";
import { listGames } from "@/lib/content";
import { formatNumber } from "@/lib/utils";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Games",
  description:
    "DarkUniverse Studios Roblox experiences — live status, player counts and direct play links.",
  alternates: { canonical: "/games" },
};

const statusVariant = {
  Live: "success",
  Beta: "info",
  Testing: "warning",
  Development: "secondary",
} as const;

export default async function GamesPage() {
  const games = await listGames();
  const sorted = [...games].sort((a, b) => b.players - a.players);
  const totalPlayers = games.reduce((s, g) => s + g.players, 0);

  return (
    <>
      <PageHeader
        eyebrow="Experiences"
        title="Games"
        description={`${games.length} Roblox ${
          games.length === 1 ? "experience" : "experiences"
        } from DarkUniverse Studios and the community. Each page shows live stats pulled from Roblox itself.`}
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">
            {games.filter((g) => g.status === "Live").length} live
          </Badge>
          <Badge variant="secondary">
            {totalPlayers > 0
              ? `${formatNumber(totalPlayers)} playing total`
              : `${games.length} ${games.length === 1 ? "game" : "games"}`}
          </Badge>
        </div>
      </PageHeader>

      <ContentSection>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((game) => (
            <Link key={game.id} href={`/games/${game.slug}`} className="group block">
              <Card className="h-full overflow-hidden transition-colors group-hover:border-primary/40">
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/30 via-secondary to-background">
                  <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" aria-hidden />
                  <div className="absolute left-3 top-3 flex gap-2">
                    <Badge variant={statusVariant[game.status]}>{game.status}</Badge>
                    {game.featured && (
                      <Badge className="border-transparent bg-black/60 text-white backdrop-blur">
                        <Sparkles /> Featured
                      </Badge>
                    )}
                  </div>
                  {game.players > 0 && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs text-white/90">
                      <Users className="size-3.5" />
                      {formatNumber(game.players)} playing
                    </div>
                  )}
                </div>
                <CardContent className="flex flex-col gap-2 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold group-hover:text-foreground">{game.name}</h2>
                    <Badge variant="secondary">{game.genre}</Badge>
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {game.description}
                  </p>
                  {game.update && (
                    <p className="text-xs text-muted-foreground">
                      v{game.update.version} · {game.update.notes}
                    </p>
                  )}
                  <span className="mt-auto flex items-center gap-1 pt-2 text-xs font-medium text-primary">
                    View details <ExternalLink className="size-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="mt-10 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm font-medium">Want to see live player counts?</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Every game page pulls real-time stats from Roblox&apos;s games API,
              including votes, visits and current server population.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tools/roblox-game-lookup">
                Try the game lookup tool <ExternalLink />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="mt-6">
          <SubmitGameForm />
        </div>
      </ContentSection>
    </>
  );
}
