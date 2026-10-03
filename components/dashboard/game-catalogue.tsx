"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, Loader2, ExternalLink, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/section";
import { formatNumber } from "@/lib/utils";

export interface CatalogueGame {
  slug: string;
  name: string;
  genre: string;
  status: string;
  players: number;
  universeId: string | null;
  robloxUrl: string;
}

type LiveState = "idle" | "loading" | "ready" | "unavailable";

export function GameCatalogue({ games }: { games: CatalogueGame[] }) {
  const [live, setLive] = React.useState<Record<string, number | null>>({});
  const [state, setState] = React.useState<LiveState>("idle");

  const load = async () => {
    setState("loading");
    const targets = games.filter((g) => g.universeId);
    if (targets.length === 0) {
      setState("unavailable");
      return;
    }
    const results = await Promise.allSettled(
      targets.map(async (game) => {
        const res = await fetch(
          `/api/roblox/game?id=${encodeURIComponent(game.universeId!)}`,
          { cache: "no-store" },
        );
        const json = res.ok ? await res.json() : null;
        const playing = json?.data?.game?.playing;
        return [game.slug, typeof playing === "number" ? playing : null] as const;
      }),
    );

    const next: Record<string, number | null> = {};
    let ok = 0;
    results.forEach((result, index) => {
      const slug = targets[index].slug;
      if (result.status === "fulfilled") {
        next[slug] = result.value[1];
        if (result.value[1] !== null) ok += 1;
      } else {
        next[slug] = null;
      }
    });
    setLive((prev) => ({ ...prev, ...next }));
    setState(ok > 0 ? "ready" : "unavailable");
  };

  if (games.length === 0) {
    return (
      <EmptyState
        title="No games in the catalogue"
        description="Add a game from the admin panel to track it here."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {state === "ready"
            ? "Live player counts loaded from Roblox."
            : state === "loading"
              ? "Fetching live counts…"
              : state === "unavailable"
                ? "Live counts unavailable for these entries — showing catalogue numbers."
                : "Catalogue numbers are cached; refresh for live Roblox counts."}
        </p>
        <Button size="sm" variant="outline" onClick={load} disabled={state === "loading"}>
          {state === "loading" ? <Loader2 className="animate-spin" /> : <Activity />}
          {state === "loading" ? "Loading…" : "Load live counts"}
        </Button>
      </div>

      <ul className="space-y-3">
        {games.map((game) => (
          <li
            key={game.slug}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{game.name}</p>
                <Badge variant="secondary">{game.genre}</Badge>
                <Badge variant={game.status === "Live" ? "success" : "outline"}>
                  {game.status}
                </Badge>
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {game.players > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Gamepad2 className="size-3.5" />
                    {formatNumber(game.players)} catalogue players
                  </span>
                )}
                {state === "loading" ? (
                  <Skeleton className="h-4 w-24" />
                ) : live[game.slug] != null ? (
                  <span className="inline-flex items-center gap-1 text-success">
                    <Activity className="size-3.5" />
                    {formatNumber(live[game.slug] ?? 0)} playing now
                  </span>
                ) : (
                  <span>live count unavailable</span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/games/${game.slug}`}>
                  <ExternalLink /> Hub page
                </Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <a href={game.robloxUrl} target="_blank" rel="noreferrer">
                  Roblox <ExternalLink />
                </a>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
