"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/section";
import type { SavedToolEntry } from "@/lib/dashboard";
import { formatRelativeTime } from "@/lib/utils";

export function SavedToolsList({ initial }: { initial: SavedToolEntry[] }) {
  const [items, setItems] = React.useState(initial);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const remove = async (slug: string) => {
    setBusy(slug);
    setError(null);
    try {
      const res = await fetch(`/api/tools/saved?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.slug !== slug));
      } else {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Could not remove that tool.");
      }
    } catch {
      setError("Network error — tool was not removed.");
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title="No saved tools yet"
        description="Open any tool page and press Save to pin it here."
        action={
          <Button size="sm" asChild>
            <Link href="/tools">Browse tools</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <ul className="space-y-3">
        {items.map((tool) => (
          <li
            key={tool.slug}
            className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{tool.name ?? tool.slug}</p>
                {tool.category && <Badge variant="secondary">{tool.category}</Badge>}
              </div>
              <p className="truncate font-mono text-xs text-muted-foreground">
                /tools/{tool.slug}
                {tool.savedAt ? ` · saved ${formatRelativeTime(tool.savedAt)}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={tool.href ?? `/tools/${tool.slug}`}>
                  <ExternalLink /> Open
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => remove(tool.slug)}
                disabled={busy === tool.slug}
                aria-label={`Remove ${tool.name ?? tool.slug}`}
              >
                {busy === tool.slug ? <Loader2 className="animate-spin" /> : <Trash2 />}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
