"use client";

import * as React from "react";
import { Check, Copy, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ shell */

export function ToolShell({
  title,
  description,
  children,
  aside,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-6">
        {(title || description) && (
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
      {aside && <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">{aside}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  className,
  actions,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <Card className={className}>
      {(title || actions) && (
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1.5">
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions}
        </CardHeader>
      )}
      <CardContent className={cn(!title && "pt-5", "space-y-4")}>
        {children}
      </CardContent>
    </Card>
  );
}

export function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-2.5 p-4 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0 text-info" />
        <div>{children}</div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ copy */

export function useCopy() {
  const [copied, setCopied] = React.useState(false);

  const copy = React.useCallback(
    async (value: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          const el = document.createElement("textarea");
          el.value = value;
          el.style.position = "fixed";
          el.style.opacity = "0";
          document.body.appendChild(el);
          el.select();
          document.execCommand("copy");
          document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      } catch {
        setCopied(false);
      }
    },
    [],
  );

  return { copied, copy };
}

export function CopyButton({
  value,
  label = "Copy",
  size = "sm",
  variant = "secondary",
  className,
}: {
  value: string;
  label?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "secondary" | "outline" | "ghost";
  className?: string;
}) {
  const { copied, copy } = useCopy();
  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={() => copy(value)}
      disabled={!value}
      aria-label={copied ? "Copied" : label}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
      {copied ? "Copied" : label}
    </Button>
  );
}

/* ------------------------------------------------------------------ misc */

export function LoadingRow({ label = "Working…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyRow({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {label}
    </p>
  );
}

export function KeyValue({
  items,
  columns = 2,
}: {
  items: Array<{ label: string; value: React.ReactNode; mono?: boolean }>;
  columns?: number;
}) {
  return (
    <dl
      className={cn(
        "grid gap-3",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-3",
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-border bg-surface/70 px-3.5 py-2.5"
        >
          <dt className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">
            {item.label}
          </dt>
          <dd
            className={cn(
              "mt-0.5 break-words text-sm font-medium",
              item.mono && "font-mono",
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Client-side fetch helper that always returns a friendly shape. */
export async function apiGet<T = unknown>(
  url: string,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      return {
        ok: false,
        error: json?.error ?? `Request failed (HTTP ${res.status}).`,
      };
    }
    return { ok: true, data: json.data as T };
  } catch {
    return { ok: false, error: "Network error — check your connection and try again." };
  }
}
