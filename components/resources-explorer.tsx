"use client";

import * as React from "react";
import { Search, ExternalLink, Download, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/section";
import { resources } from "@/lib/data/resources";
import { resourceCategories } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { Resource } from "@/types";

export function ResourcesExplorer({ items = resources }: { items?: Resource[] }) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [showFeatured, setShowFeatured] = React.useState(false);

  const usedCategories = React.useMemo(() => {
    const set = new Set(items.map((r) => r.category));
    return resourceCategories.filter((c) => set.has(c));
  }, [items]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (showFeatured && !r.featured) return false;
      if (!q) return true;
      return [r.name, r.description, r.category, ...r.tags]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, query, category, showFeatured]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const r of filtered) {
      const list = map.get(r.category) ?? [];
      list.push(r);
      map.set(r.category, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources, docs and communities…"
            className="pl-9"
            aria-label="Search resources"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip active={category === "all"} onClick={() => setCategory("all")} label="All" count={items.length} />
          {usedCategories.map((c) => (
            <Chip
              key={c}
              active={category === c}
              onClick={() => setCategory(category === c ? "all" : c)}
              label={c}
              count={items.filter((r) => r.category === c).length}
            />
          ))}
          <Chip
            active={showFeatured}
            onClick={() => setShowFeatured((v) => !v)}
            label="★ Featured"
            count={items.filter((r) => r.featured).length}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No resources found"
          description="Nothing matches that search. Try a broader keyword or reset the filters."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setShowFeatured(false);
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        grouped.map(([cat, list]) => (
          <div key={cat}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-lg font-semibold">{cat}</h2>
              <Badge variant="secondary">{list.length}</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block h-full"
                >
                  <Card className="h-full transition-colors group-hover:border-primary/40">
                    <CardContent className="flex h-full flex-col gap-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-snug">{resource.name}</h3>
                        <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {resource.description}
                      </p>
                      <div className="mt-auto flex flex-wrap gap-1.5">
                        {resource.featured && (
                          <Badge variant="default">
                            <Star className="size-3" /> Featured
                          </Badge>
                        )}
                        {resource.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {resource.downloadUrl && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <Download className="size-3.5" /> Direct download available
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Chip({
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
