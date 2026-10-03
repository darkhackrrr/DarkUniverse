"use client";

import * as React from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/session-provider";

export function SaveToolButton({ slug }: { slug: string }) {
  const { user, loaded } = useSession();
  const [saved, setSaved] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    fetch("/api/tools/saved", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json?.ok) return;
        const list: Array<{ slug: string }> = json.data?.saved ?? [];
        setSaved(list.some((entry) => entry.slug === slug));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [loaded, slug, user?.id]);

  const toggle = async () => {
    if (!loaded) return;
    if (!user) {
      window.location.href = "/api/auth/login?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        saved ? `/api/tools/saved?slug=${encodeURIComponent(slug)}` : "/api/tools/saved",
        saved
          ? { method: "DELETE" }
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug }),
            },
      );
      if (res.ok) setSaved(!saved);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant={saved ? "secondary" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
    >
      {busy ? (
        <Loader2 className="animate-spin" />
      ) : saved ? (
        <BookmarkCheck />
      ) : (
        <Bookmark />
      )}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
