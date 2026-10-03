"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Gamepad2,
  Tag,
  Wrench,
  Megaphone,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/types";

const typeIcons: Record<SearchResult["type"], React.ComponentType<{ className?: string }>> = {
  tool: Wrench,
  game: Gamepad2,
  code: Tag,
  resource: FileText,
  announcement: Megaphone,
};

const typeLabels: Record<SearchResult["type"], string> = {
  tool: "Tool",
  game: "Game",
  code: "Code",
  resource: "Resource",
  announcement: "News",
};

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&limit=12`,
          { signal: controller.signal },
        );
        const json = await res.json();
        setResults(json?.data?.results ?? []);
        setActive(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (result: SearchResult) => {
    onOpenChange(false);
    router.push(result.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[70] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search DarkUniverse Hub"
    >
      <div className="glass w-full max-w-xl overflow-hidden rounded-xl border border-border shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search tools, games, codes, resources…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search query"
          />
          <kbd className="hidden rounded border border-border bg-secondary px-1.5 py-0.5 text-[0.65rem] text-muted-foreground sm:block">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {loading && (
            <div className="space-y-1.5 p-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton-shimmer h-11 rounded-md" />
              ))}
            </div>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-foreground">No matches for “{query}”</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try “avatar”, “embed”, “code” or “gradient”.
              </p>
            </div>
          )}

          {!loading && results.map((result, idx) => {
            const Icon = typeIcons[result.type];
            return (
              <button
                key={result.id}
                type="button"
                data-idx={idx}
                onMouseEnter={() => setActive(idx)}
                onClick={() => go(result)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                  idx === active ? "bg-accent" : "hover:bg-accent/60",
                )}
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-border bg-secondary text-muted-foreground">
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {result.title}
                    </span>
                    <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wide text-muted-foreground">
                      {result.badge ?? typeLabels[result.type]}
                    </span>
                  </span>
                  <span className="line-clamp-1 block text-xs text-muted-foreground">
                    {result.description}
                  </span>
                </span>
                {idx === active && (
                  <CornerDownLeft className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                )}
              </button>
            );
          })}

          {!query.trim() && (
            <div className="p-3 text-xs text-muted-foreground">
              Start typing to search tools, games, codes, resources and
              announcements.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
