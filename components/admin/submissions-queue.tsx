"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  Inbox,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatRelativeTime } from "@/lib/utils";
import type { SubmissionRow } from "@/lib/submissions";

type SubmissionType = "game" | "code";

interface Props {
  games: SubmissionRow[];
  codes: SubmissionRow[];
  readonly?: boolean;
  readonlyNote?: string;
}

const statusVariant: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  approved: "success",
  rejected: "destructive",
  pending: "warning",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariant[status] ?? "secondary"}>
      {status === "approved" ? "published" : status}
    </Badge>
  );
}

export function SubmissionsQueue({ games, codes, readonly, readonlyNote }: Props) {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const act = async (
    type: SubmissionType,
    row: SubmissionRow,
    action: "approve" | "reject" | "delete",
  ) => {
    setBusyId(row.id);
    setError(null);
    try {
      const res =
        action === "delete"
          ? await fetch(`/api/admin/submissions?type=${type}&id=${row.id}`, {
              method: "DELETE",
            })
          : await fetch("/api/admin/submissions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type, id: row.id, action, note }),
            });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        if (action === "delete") setNote("");
        router.refresh();
      } else {
        setError(json?.error ?? "That action failed.");
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusyId(null);
    }
  };

  const renderList = (type: SubmissionType, rows: SubmissionRow[], noun: string) => {
    const pending = rows.filter((row) => row.status === "pending");
    const reviewed = rows.filter((row) => row.status !== "pending");

    return (
      <Card key={type}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {type === "game" ? "Game submissions" : "Code submissions"}
            <Badge variant={pending.length ? "warning" : "secondary"}>
              {pending.length} pending
            </Badge>
          </CardTitle>
          <CardDescription>
            {type === "game"
              ? "Publishing a game adds it to the games tab. Test the link first."
              : "Publishing a code adds it to the codes page for everyone to copy."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {readonly && readonlyNote && (
            <Alert variant="warning">{readonlyNote}</Alert>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1 space-y-1.5">
              <Label htmlFor={`note-${type}`}>
                Reviewer note (optional, sent with the decision)
              </Label>
              <Input
                id={`note-${type}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. link works, tested on mobile"
                maxLength={300}
                disabled={readonly}
              />
            </div>
          </div>

          {error && <Alert variant="destructive">{error}</Alert>}

          {pending.length === 0 ? (
            <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              <Inbox className="size-4" /> Nothing waiting — new {noun}s from
              the site land here.
            </p>
          ) : (
            <ul className="space-y-3">
              {pending.map((row) => (
                <li
                  key={row.id}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{row.name}</span>
                        {row.genre && <Badge variant="secondary">{row.genre}</Badge>}
                        {row.gameName && (
                          <Badge variant="outline">{row.gameName}</Badge>
                        )}
                        <StatusBadge status={row.status} />
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {row.detail}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by @{row.submitterName || "unknown"} ·{" "}
                        {formatRelativeTime(row.createdAt)}
                        {row.note ? ` · “${row.note}”` : ""}
                      </p>
                      {row.robloxUrl && (
                        <a
                          href={row.robloxUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Open on Roblox <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        disabled={readonly || busyId === row.id}
                        onClick={() => act(type, row, "approve")}
                      >
                        {busyId === row.id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Check />
                        )}
                        Publish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={readonly || busyId === row.id}
                        onClick={() => act(type, row, "reject")}
                      >
                        <X /> Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Delete submission"
                        disabled={readonly || busyId === row.id}
                        onClick={() => act(type, row, "delete")}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {reviewed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recently reviewed
              </p>
              <ul className="space-y-2">
                {reviewed.slice(0, 8).map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <span className="truncate text-sm">
                      {row.name}
                      <span className="text-muted-foreground">
                        {" "}
                        · by @{row.submitterName || "unknown"}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <StatusBadge status={row.status} />
                      {formatRelativeTime(row.reviewedAt ?? row.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {renderList("game", games, "game")}
      {renderList("code", codes, "code")}
    </div>
  );
}
