"use client";

import * as React from "react";
import Link from "next/link";
import { Gamepad2, Loader2, Send } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/components/session-provider";
import { gameGenres } from "@/lib/config";

export function SubmitGameForm({ nextPath = "/games" }: { nextPath?: string }) {
  const { user, loaded } = useSession();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [genre, setGenre] = React.useState<string>(gameGenres[0]);
  const [robloxUrl, setRobloxUrl] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/submissions/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, genre, robloxUrl, note }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        setDone(true);
        setName("");
        setDescription("");
        setRobloxUrl("");
        setNote("");
      } else {
        setError(json?.error ?? "Could not send your submission.");
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="size-4 text-primary" /> Submit your game
        </CardTitle>
        <CardDescription>
          Built a Roblox experience? Share it with the hub. An admin plays it,
          then publishes it to the games tab.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <p className="text-sm text-muted-foreground">Checking your session…</p>
        ) : !user ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Sign in with Discord so we know who submitted it.
            </p>
            <Button size="sm" asChild>
              <Link href={`/api/auth/login?next=${encodeURIComponent(nextPath)}`}>
                Continue with Discord
              </Link>
            </Button>
          </div>
        ) : done ? (
          <div className="space-y-3">
            <Alert variant="success">
              <span className="font-medium">Sent for review.</span> An admin
              tests it first — you&apos;ll find it on the games tab once it is
              published.
            </Alert>
            <Button variant="outline" size="sm" onClick={() => setDone(false)}>
              Submit another game
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="game-name">Game name</Label>
                <Input
                  id="game-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Troll Tower: Impossible Obby"
                  maxLength={60}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="game-genre">Genre</Label>
                <Select
                  id="game-genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                >
                  {gameGenres.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="game-url">Roblox game link</Label>
              <Input
                id="game-url"
                type="url"
                value={robloxUrl}
                onChange={(e) => setRobloxUrl(e.target.value)}
                placeholder="https://www.roblox.com/games/1234567890"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="game-description">Description</Label>
              <Textarea
                id="game-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is the game about, and why should people play it?"
                maxLength={600}
                className="min-h-24"
                required
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/600
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="game-note">Anything the admin should know?</Label>
              <Input
                id="game-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional — updates, bug notes, Discord invite…"
                maxLength={300}
              />
            </div>

            {error && <Alert variant="destructive">{error}</Alert>}

            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Send />}
                Send submission
              </Button>
              <span className="text-xs text-muted-foreground">
                Signed in as @{user.username}
              </span>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
