"use client";

import * as React from "react";
import Link from "next/link";
import {
  Download,
  Loader2,
  Save,
  Trash2,
  ShieldAlert,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BioForm({ initial }: { initial: string }) {
  const [bio, setBio] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "saved" | "error">("idle");
  const [message, setMessage] = React.useState("");

  const save = async () => {
    setBusy(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        setStatus("saved");
        setMessage(json.data?.persistent ? "Saved to your profile." : "Saved to this browser.");
      } else {
        setStatus("error");
        setMessage(json?.error ?? "Could not save your bio.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          maxLength={280}
          placeholder="What do you build, play or make?"
          onChange={(e) => setBio(e.target.value)}
          className="min-h-24"
        />
        <p className="text-xs text-muted-foreground">{bio.length}/280</p>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}
          Save bio
        </Button>
        {status !== "idle" && (
          <span
            className={`inline-flex items-center gap-1.5 text-xs ${
              status === "saved" ? "text-success" : "text-destructive"
            }`}
          >
            {status === "saved" ? <Check className="size-3.5" /> : <ShieldAlert className="size-3.5" />}
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

export function ExportDataButton({ username }: { username: string }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/export", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Export failed.");
        return;
      }
      const blob = new Blob([JSON.stringify(json.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `darkuniverse-data-${username}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" variant="outline" onClick={download} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Download />}
        Download my data
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

export function DeleteAccountButton() {
  const [open, setOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const remove = async () => {
    if (confirm.toLowerCase() !== "delete my account") return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/account", { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        window.location.href = "/";
        return;
      }
      setError(json?.error ?? "Could not delete your account.");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 /> Delete account
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <p className="text-sm">
        This permanently removes your profile, saved tools, badges and activity.
        It cannot be undone.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="confirm-delete" className="sr-only">
          Type delete my account to confirm
        </Label>
        <Input
          id="confirm-delete"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Type: delete my account"
          className="max-w-xs"
        />
        <Button
          size="sm"
          variant="destructive"
          onClick={remove}
          disabled={busy || confirm.toLowerCase() !== "delete my account"}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
          Permanently delete
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </Button>
        <Link href="/dashboard" className="text-xs text-muted-foreground underline">
          Keep my account
        </Link>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
