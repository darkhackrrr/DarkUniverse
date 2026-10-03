import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, CalendarClock, ExternalLink, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listCodes, listGames } from "@/lib/content";
import { GameLiveStats } from "@/components/games/live-stats";
import { formatDate, formatNumber } from "@/lib/utils";

/** Content can be edited from /admin, so game pages render per request. */
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const games = await listGames();
  return games.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const games = await listGames();
  const game = games.find((g) => g.slug === slug);
  if (!game) return { title: "Game not found" };
  return {
    title: game.name,
    description: game.description,
    alternates: { canonical: `/games/${game.slug}` },
    openGraph: { title: game.name, description: game.description, type: "website" },
  };
}

export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;
  const [games, gameCodes] = await Promise.all([listGames(), listCodes()]);
  const game = games.find((g) => g.slug === slug);
  if (!game) notFound();

  const codes = gameCodes.filter((c) => c.gameSlug === game.slug);
  const others = games.filter((g) => g.slug !== game.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/games" className="inline-flex items-center gap-1.5 hover:text-foreground">
          <ArrowLeft className="size-4" /> Games
        </Link>
        <span>/</span>
        <span className="text-foreground">{game.name}</span>
      </nav>

      <header className="mb-8 overflow-hidden rounded-2xl border border-border">
        <div className="relative aspect-[21/9] bg-gradient-to-br from-primary/40 via-secondary to-background">
          <div className="absolute inset-0 grid-bg opacity-50" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" aria-hidden />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant={game.status === "Live" ? "success" : "info"}>{game.status}</Badge>
              <Badge variant="secondary">{game.genre}</Badge>
              {game.featured && <Badge>Featured</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{game.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {game.players > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="size-4 text-success" />{" "}
                  {formatNumber(game.players)} playing now
                </span>
              )}
              {game.update && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarClock className="size-4" /> v{game.update.version} ·{" "}
                  {formatDate(game.update.date)}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About this experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {game.description}
              </p>
              {game.update && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    Latest update — v{game.update.version}
                  </p>
                  <p className="mt-1 text-sm">{game.update.notes}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Released {formatDate(game.update.date)}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href={game.robloxUrl} target="_blank" rel="noopener noreferrer">
                    Play on Roblox <ExternalLink />
                  </a>
                </Button>
                <Button variant="secondary" asChild>
                  <a
                    href={`https://www.roblox.com/games/${extractPlaceId(game.robloxUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Bookmark
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <GameLiveStats placeId={extractPlaceId(game.robloxUrl)} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="size-4 text-primary" /> Codes for {game.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {codes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No codes published yet — check the{" "}
                  <Link href="/codes" className="text-primary hover:underline">
                    codes directory
                  </Link>
                  .
                </p>
              ) : (
                <div className="space-y-2">
                  {codes.map((code) => (
                    <div
                      key={code.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                    >
                      <div>
                        <p className="font-mono text-sm font-semibold">{code.code}</p>
                        <p className="text-xs text-muted-foreground">{code.reward}</p>
                      </div>
                      <Badge
                        variant={
                          code.status === "active"
                            ? "success"
                            : code.status === "upcoming"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {code.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                ["Genre", game.genre],
                ["Status", game.status],
                ["Players (cached)", game.players > 0 ? formatNumber(game.players) : "—"],
                ["Universe ID", game.universeId ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-right font-medium">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {others.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>More games</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {others.map((g) => (
                  <Link
                    key={g.id}
                    href={`/games/${g.slug}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm transition-colors hover:border-primary/40"
                  >
                    <span className="truncate">{g.name}</span>
                    <Badge variant="secondary">{g.genre}</Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function extractPlaceId(url: string): string {
  const match = url.match(/\/games\/(\d+)/);
  return match?.[1] ?? "";
}
