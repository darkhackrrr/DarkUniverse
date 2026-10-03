"use client";

import * as React from "react";
import Link from "next/link";
import { Gift, Loader2, Send } from "lucide-react";
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
import { useSession } from "@/components/session-provider";

interface GameOption {
  id: string;
  name: string;
}

export function SubmitCodeForm({
  games,
  nextPath = "/codes",
}: {
  games: GameOption[];
  nextPath?: string;
}) {
  const { user, loaded } = useSession();
  const [code, setCode] = React.useState("");
  const [reward, setReward] = React.useState("");
  const [gameId, setGameId] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const game = games.find((option) => option.id === gameId);
      const res = await fetch("/api/submissions/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          reward,
          gameName: game?.name ?? "",
          expiresAt,
          note,
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        setDone(true);
        setCode("");
        setReward("");
        setExpiresAt("");
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
          <Gift className="size-4 text-primary" /> Share a code
        </CardTitle>
        <CardDescription>
          Found a working code? Send it in and an admin will verify it before it
          appears on this page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <p className="text-sm text-muted-foreground">Checking your session…</p>
        ) : !user ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              Sign in with Discord so we know who found it.
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
              <span className="font-medium">Sent for review.</span> It will
              appear under codes once an admin has tested it.
            </Alert>
            <Button variant="outline" size="sm" onClick={() => setDone(false)}>
              Share another code
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="code-value">Code</Label>
                <Input
                  id="code-value"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="WELCOME2026"
                  maxLength={40}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code-reward">What it gives</Label>
                <Input
                  id="code-reward"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder="500 Coins"
                  maxLength={120}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="code-game">Game</Label>
                <Select
                  id="code-game"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                >
                  <option value="">No specific game</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="code-expiry">Expires (optional)</Label>
                <Input
                  id="code-expiry"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code-note">Note</Label>
              <Input
                id="code-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional — where you found it, requirements…"
                maxLength={300}
              />
            </div>

            {error && <Alert variant="destructive">{error}</Alert>}

            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Send />}
                Send code
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
