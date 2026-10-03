import type { Metadata } from "next";
import { FileCode2, KeyRound, Gauge, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { guardAdmin } from "@/lib/auth/guards";
import {
  isDatabaseConfigured,
  isOAuthConfigured,
  adminDiscordIds,
  siteConfig,
} from "@/lib/config";

export const metadata: Metadata = {
  title: "Admin settings",
  robots: { index: false },
};

const envVars: Array<{ key: string; required: boolean; note: string }> = [
  { key: "DATABASE_URL", required: true, note: "PostgreSQL connection string — enables all writes." },
  { key: "AUTH_SECRET", required: true, note: "HMAC secret for session cookies (16+ chars)." },
  { key: "DISCORD_CLIENT_ID", required: true, note: "Discord application id." },
  { key: "DISCORD_CLIENT_SECRET", required: true, note: "Discord application secret." },
  { key: "ADMIN_DISCORD_IDS", required: true, note: "Comma separated Discord user ids." },
  { key: "DISCORD_BOT_TOKEN", required: false, note: "Reserved for bot-backed features." },
  { key: "ROBLOX_API_KEY", required: false, note: "Unlocks authenticated Roblox Open Cloud calls." },
  { key: "API_SECRET", required: false, note: "Signs server-to-server webhook calls." },
  { key: "ALLOW_DEMO_LOGIN", required: false, note: "Must be explicitly true for demo sign-in in production." },
  { key: "RATE_LIMIT_MAX", required: false, note: "Overrides the per-IP request budget." },
  { key: "NEXT_PUBLIC_SITE_URL", required: false, note: "Canonical origin used for sitemap/OG URLs." },
];

export default async function AdminSettingsPage() {
  await guardAdmin("/admin/settings");

  const rows = envVars.map((variable) => {
    const set = Boolean(process.env[variable.key]);
    return { ...variable, set };
  });
  const missing = rows.filter((row) => row.required && !row.set);

  return (
    <>
      {missing.length > 0 && (
        <Alert variant="warning">
          <span className="font-medium">
            {missing.length} required variable{missing.length === 1 ? "" : "s"} missing.
          </span>{" "}
          {missing.map((row) => row.key).join(", ")} — add them in your hosting
          environment (Vercel → Project → Settings → Environment Variables) and
          redeploy.
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" /> Environment variables
          </CardTitle>
          <CardDescription>
            Values are never displayed here — only whether each variable is set.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex flex-col gap-1 rounded-lg border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm">{row.key}</p>
                <p className="text-xs text-muted-foreground">{row.note}</p>
              </div>
              <Badge variant={row.set ? "success" : row.required ? "destructive" : "outline"}>
                {row.set ? "Set" : row.required ? "Required — missing" : "Optional"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode2 className="size-4 text-muted-foreground" /> Editable files
            </CardTitle>
            <CardDescription>Content owned by the codebase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["lib/data/games.ts", "Game catalogue"],
              ["lib/data/codes.ts", "Game codes"],
              ["lib/data/resources.ts", "Resources"],
              ["lib/data/announcements.ts", "Updates / announcements"],
              ["lib/data/rewards.ts", "Rewards and badges"],
              ["lib/tools/registry.ts", "Tool listing"],
              ["lib/config.ts", "Nav, stats and community links"],
            ].map(([path, label]) => (
              <div
                key={path}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-2.5"
              >
                <code className="text-xs">{path}</code>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="size-4 text-muted-foreground" /> Runtime behaviour
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Rate limits are per-IP and per-route (typically 40–60 requests per
              window), configurable with <code className="font-mono">RATE_LIMIT_MAX</code>.
            </p>
            <p>
              Roblox responses are cached in-memory for 60–120 seconds; admin
              catalogue reads merge database rows over the built-in seeds.
            </p>
            <p>
              Sessions last 14 days and are signed with HMAC-SHA256 using{" "}
              <code className="font-mono">AUTH_SECRET</code>.
            </p>
            <p>
              Admin allow-list currently has{" "}
              <span className="font-medium text-foreground">
                {adminDiscordIds().length}
              </span>{" "}
              Discord id{adminDiscordIds().length === 1 ? "" : "s"}.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="size-4 text-muted-foreground" /> Deployment
          </CardTitle>
          <CardDescription>
            {siteConfig.name} is a static-first Next.js app — no server beyond
            the API routes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Provision PostgreSQL (Vercel Postgres, Neon, Supabase…) and set{" "}
              <code className="font-mono">DATABASE_URL</code>.
            </li>
            <li>
              Run <code className="font-mono">npx prisma db push</code> (or{" "}
              <code className="font-mono">npm run db:push</code>) to create tables.
            </li>
            <li>
              Set the remaining variables above, then deploy —{" "}
              <code className="font-mono">npm run build</code> runs{" "}
              <code className="font-mono">prisma generate</code> automatically.
            </li>
          </ol>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant={isDatabaseConfigured() ? "success" : "warning"}>
              Database {isDatabaseConfigured() ? "ready" : "not configured"}
            </Badge>
            <Badge variant={isOAuthConfigured() ? "success" : "warning"}>
              OAuth {isOAuthConfigured() ? "ready" : "not configured"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
