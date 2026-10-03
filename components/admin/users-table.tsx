"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, Shield, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatRelativeTime } from "@/lib/utils";

export interface AdminUserRow {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  discordId: string | null;
  role: string;
  points: number;
  createdAt: string;
  savedTools?: number;
}

export function AdminUsersTable({
  rows,
  readOnly,
  selfId,
  allowList,
}: {
  rows: AdminUserRow[];
  readOnly: boolean;
  selfId: string;
  allowList: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.username, row.name ?? "", row.email ?? "", row.discordId ?? "", row.role]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, query]);

  const setRole = async (id: string, role: "USER" | "ADMIN") => {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) setError(json?.error ?? "Could not update role.");
      else router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string, username: string) => {
    if (!window.confirm(`Delete @${username}? This cannot be undone.`)) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) setError(json?.error ?? "Could not delete user.");
      else router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users…"
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {rows.length} users
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-surface">
            <tr className="border-b border-border text-left text-[0.7rem] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Discord</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Points</th>
              <th className="px-4 py-3 font-medium">Saved</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No users match your search.
                </td>
              </tr>
            )}
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">@{user.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.name ?? "—"} · {user.email ?? "no email"}
                  </p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {user.discordId ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                    {user.role === "ADMIN" ? <ShieldCheck /> : <Shield />}
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">{formatNumber(user.points)}</td>
                <td className="px-4 py-3">{user.savedTools ?? 0}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatRelativeTime(user.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {!readOnly && user.id !== selfId && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === user.id}
                          onClick={() =>
                            setRole(user.id, user.role === "ADMIN" ? "USER" : "ADMIN")
                          }
                        >
                          {busy === user.id ? (
                            <Loader2 className="animate-spin" />
                          ) : user.role === "ADMIN" ? (
                            "Revoke admin"
                          ) : (
                            "Make admin"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Delete @${user.username}`}
                          disabled={busy === user.id}
                          onClick={() => remove(user.id, user.username)}
                        >
                          <Trash2 />
                        </Button>
                      </>
                    )}
                    {readOnly && (
                      <span className="text-xs text-muted-foreground">read-only</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {allowList.length > 0 && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">ADMIN_DISCORD_IDS:</span>{" "}
          {allowList.join(", ")} — these accounts are admins regardless of their
          stored role.
        </p>
      )}
    </div>
  );
}
