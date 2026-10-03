"use client";

import * as React from "react";
import { LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DemoLoginForm() {
  const [username, setUsername] = React.useState("DemoUser");
  const [admin, setAdmin] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  return (
    <form
      action="/api/auth/demo"
      method="POST"
      onSubmit={() => setSubmitting(true)}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="demo-username">Demo username</Label>
        <Input
          id="demo-username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="DemoUser"
          maxLength={20}
        />
        <p className="text-xs text-muted-foreground">
          3–20 characters, letters/numbers/underscores.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          name="role"
          value="admin"
          checked={admin}
          onChange={(e) => setAdmin(e.target.checked)}
          className="size-4 accent-[var(--color-primary)]"
        />
        Sign in as admin (development only)
      </label>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="animate-spin" /> : <LogIn />}
        {submitting ? "Signing in…" : "Demo sign-in"}
      </Button>
    </form>
  );
}
