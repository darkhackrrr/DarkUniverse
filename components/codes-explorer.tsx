"use client";

import * as React from "react";
import { Search, Check, Copy, Clock, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/section";
import { gameCodes } from "@/lib/data/codes";
import { games } from "@/lib/data/games";
import { cn, formatDate } from "@/lib/utils";
import type { Game, GameCode } from "@/types";

const statusFilters = ["all", "active", "expired", "upcoming"] as const;

export function CodesExplorer({
  codes = gameCodes,
  gameList = games,
}: {
  codes?: GameCode[];
  gameList?: Game[];
}) {
  const [query, setQuery] = React.useState("");
  const [game, setGame] = React.useState("all");
  const [status, setStatus] = React.useState<(typeof statusFilters)[number]>("all");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return codes.filter((code) => {
      if (game !== "all" && code.gameSlug !== game) return false;
      if (status !== "all" && code.status !== status) return false;
      if (!q) return true;
      return [code.code, code.reward, code.gameName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [query, game, status, codes]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search codes or rewards…"
            className="pl-9"
            aria-label="Search codes"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Filter by game"
          >
            <option value="all">All games</option>
            {gameList.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>

          {statusFilters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm capitalize transition-colors",
                status === s
                  ? "border-primary/60 bg-primary/15 text-foreground"
                  : "border-border bg-surface text-muted-foreground hover:border-primary/40",
              )}
              aria-pressed={status === s}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          {filtered.length} of {codes.length} codes
        </span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">
          {codes.filter((c) => c.status === "active").length} active right now
        </span>
      </div>

      {codes.length === 0 ? (
        <EmptyState
          title="No codes published yet"
          description="Troll Tower: Impossible Obby doesn't use codes right now. When one goes live it will show up here first."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No codes match those filters"
          description="Try clearing the search or switching the status filter back to “all”."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery("");
                setGame("all");
                setStatus("all");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((code) => (
            <CodeCard key={code.id} code={code} />
          ))}
        </div>
      )}
    </div>
  );
}

function CodeCard({ code }: { code: GameCode }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const variant =
    code.status === "active"
      ? "success"
      : code.status === "upcoming"
        ? "warning"
        : "secondary";

  return (
    <Card
      className={cn(
        "transition-colors",
        code.status === "expired" && "opacity-70",
        code.status === "active" && "hover:border-primary/40",
      )}
    >
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-lg font-bold tracking-wider">{code.code}</p>
            <p className="mt-1 text-sm text-muted-foreground">{code.reward}</p>
          </div>
          <Badge variant={variant}>{code.status}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {code.gameName && <span>{code.gameName}</span>}
          {code.expiresAt ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" /> Ends {formatDate(code.expiresAt)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-success">
              <Sparkles className="size-3.5" /> No expiry
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {code.status === "active"
              ? "Redeem in-game or on the Roblox site"
              : code.status === "upcoming"
                ? "Not released yet"
                : "No longer working"}
          </span>
          <Button
            size="sm"
            variant={code.status === "active" ? "default" : "outline"}
            onClick={copy}
            disabled={code.status !== "active"}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
