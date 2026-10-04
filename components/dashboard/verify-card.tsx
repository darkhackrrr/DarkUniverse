"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { communityLinks } from "@/lib/config";
import type { VerifyStatus } from "@/lib/verify";

export function VerifyCard({ initial }: { initial: VerifyStatus }) {
  const [status, setStatus] = useState<VerifyStatus>(initial);
  const [issuing, setIssuing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function issue() {
    setIssuing(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/verify", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not create a code.");
        return;
      }
      setStatus((prev) => ({
        database: true,
        verified: prev.verified,
        code: body.data.code,
      }));
      setCopied(false);
    } catch {
      setError("Network error — try again.");
    } finally {
      setIssuing(false);
    }
  }

  async function copy() {
    if (!status.code) return;
    try {
      await navigator.clipboard.writeText(status.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard blocked — copy the code manually.");
    }
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" /> Discord verification
          </span>
          {status.verified && <Badge>Verified</Badge>}
        </CardTitle>
        <CardDescription>
          Link this account with Discord to unlock the Verified role in our
          server.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {status.code ? (
          <>
            <button
              type="button"
              onClick={copy}
              className="flex w-full items-center justify-between rounded-lg border border-primary/40 bg-surface px-4 py-3 font-mono text-lg font-bold tracking-widest"
            >
              {status.code}
              {copied ? (
                <Check className="size-4 text-success" />
              ) : (
                <Copy className="size-4 text-muted-foreground" />
              )}
            </button>
            <p className="text-xs text-muted-foreground">
              Run <code className="font-mono">/verify {status.code}</code> in
              our Discord. The code expires in 10 minutes.
            </p>
          </>
        ) : (
          <Button
            size="sm"
            className="w-full"
            onClick={issue}
            disabled={issuing || !status.database}
          >
            {issuing ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              "Generate verification code"
            )}
          </Button>
        )}
        {!status.database && (
          <p className="text-xs text-warning">
            No database configured — verification is unavailable.
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        {status.code && !status.verified && (
          <Button
            size="sm"
            variant="ghost"
            className="w-full"
            onClick={issue}
            disabled={issuing}
          >
            Generate a new code
          </Button>
        )}
        {communityLinks.discord && (
          <Button size="sm" variant="outline" className="w-full" asChild>
            <Link href={communityLinks.discord} target="_blank">
              Open our Discord
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
