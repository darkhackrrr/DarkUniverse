"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ToolCard } from "@/components/section";
import { categories, tools } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function ToolsExplorer({ initialCategory }: { initialCategory?: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(
    initialCategory && categories.includes(initialCategory as never)
      ? initialCategory
      : null,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      if (category && tool.category !== category) return false;
      if (!q) return true;
      const haystack = [
        tool.name,
        tool.description,
        tool.category,
        tool.slug,
        ...(tool.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, category]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof tools>();
    for (const tool of filtered) {
      const list = map.get(tool.category) ?? [];
      list.push(tool);
      map.set(tool.category, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const tool of tools) {
      map.set(tool.category, (map.get(tool.category) ?? 0) + 1);
    }
    return map;
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tools.length} tools — try “avatar”, “embed”, “resize”.`}
            className="pl-9 pr-9"
            aria-label="Search tools"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={category === null}
            onClick={() => setCategory(null)}
            label="All"
            count={tools.length}
          />
          {categories.map((cat) => (
            <FilterChip
              key={cat}
              active={category === cat}
              onClick={() => setCategory(category === cat ? null : cat)}
              label={cat}
              count={counts.get(cat) ?? 0}
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No tools match that search"
          description={`Nothing found for “${query}”. Try a different keyword, or browse a category above.`}
          action={
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory(null);
              }}
              className="text-sm text-primary hover:underline"
            >
              Reset filters
            </button>
          }
        />
      ) : (
        grouped.map(([cat, list]) => (
          <div key={cat} className="scroll-mt-24" id={cat.toLowerCase()}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-lg font-semibold">{cat}</h2>
              <Badge variant="secondary">{list.length}</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </div>
        ))
      )}

      <p className="pt-4 text-sm text-muted-foreground">
        Looking for something else?{" "}
        <Link href="/resources" className="text-primary hover:underline">
          Browse resources
        </Link>{" "}
        or{" "}
        <Link href="/community" className="text-primary hover:underline">
          join the community
        </Link>
        .
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        active
          ? "border-primary/60 bg-primary/15 text-foreground"
          : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
      aria-pressed={active}
    >
      {label}
      <span className="text-xs text-muted-foreground">{count}</span>
    </button>
  );
}
