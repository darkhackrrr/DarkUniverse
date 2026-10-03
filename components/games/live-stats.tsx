"use client";

import * as React from "react";
import { Activity, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet } from "@/components/tools/tool-shell";
import { formatNumber, formatRelativeTime } from "@/lib/utils";

interface GamePayload {
  game: {
    playing: number;
    visits: number;
    favoritedCount?: number;
    maxPlayers: number;
    updated: string;
    creator: { name: string };
  };
  votes: { up: number; down: number; ratio: number } | null;
  thumbnailUrl?: string | null;
}

export function GameLiveStats({ placeId }: { placeId: string }) {
  const [data, setData] = React.useState<GamePayload | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!placeId) {
      setError("No place ID available for this game yet.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await apiGet<GamePayload>(`/api/roblox/game?id=${placeId}`);
    if (res.ok) setData(res.data);
    else {
      setData(null);
      setError(res.error);
    }
    setLoading(false);
  }, [placeId]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Live stats</CardTitle>
          <CardDescription>Read from Roblox when you load this page.</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Activity />}
          {loading ? "Checking…" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !data && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            {error}
          </p>
        )}

        {data && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Playing now"
              value={formatNumber(data.game.playing)}
              tone="text-success"
              icon={<Activity className="size-4" />}
            />
            <Stat
              label="Visits"
              value={formatNumber(data.game.visits)}
              icon={<Activity className="size-4" />}
            />
            <Stat
              label="Favorites"
              value={data.game.favoritedCount ? formatNumber(data.game.favoritedCount) : "—"}
              icon={<Activity className="size-4" />}
            />
            <Stat label="Max players" value={String(data.game.maxPlayers)} />
            <Stat label="Creator" value={data.game.creator.name} />
            <Stat label="Updated" value={formatRelativeTime(data.game.updated)} />
            <div className="sm:col-span-3">
              {data.votes ? (
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-success" style={{ width: `${data.votes.ratio}%` }} />
                  </div>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="size-3.5 text-success" /> {formatNumber(data.votes.up)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ThumbsDown className="size-3.5 text-destructive" /> {formatNumber(data.votes.down)}
                    </span>
                    <span className="font-medium text-foreground">{data.votes.ratio}% liked</span>
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Vote data unavailable.</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone = "text-foreground",
  icon,
}: {
  label: string;
  value: string;
  tone?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="flex items-center gap-1.5 text-[0.7rem] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
