import type { Metadata } from "next";
import Link from "next/link";
import {
  Gamepad2,
  Ticket,
  Wrench,
  BookOpen,
  Megaphone,
  Users,
  Trophy,
  ArrowUpRight,
  ScrollText,
  Inbox,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { guardAdmin } from "@/lib/auth/guards";
import {
  listGames,
  listCodes,
  listResources,
  listAnnouncements,
} from "@/lib/content";
import { tools } from "@/lib/tools/registry";
import { badges, activeRewardCount } from "@/lib/data/rewards";
import { getPrisma } from "@/lib/database/client";
import { isDatabaseConfigured, isOAuthConfigured, adminDiscordIds } from "@/lib/config";
import { formatNumber, formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin overview",
  robots: { index: false },
};

export default async function AdminOverviewPage() {
  const admin = await guardAdmin("/admin");
  const [games, codes, resources, announcements] = await Promise.all([
    listGames(),
    listCodes(),
    listResources(),
    listAnnouncements(),
  ]);

  const prisma = getPrisma();
  let userCount = 1;
  let pendingSubmissions = 0;
  let recent: Array<{ id: string; type: string; message: string; createdAt: string }> = [];
  if (prisma) {
    try {
      userCount = await prisma.user.count();
      pendingSubmissions =
        (await prisma.gameSubmission.count({ where: { status: "pending" } })) +
        (await prisma.codeSubmission.count({ where: { status: "pending" } }));
      const rows = await prisma.activity.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
      });
      recent = rows.map((row) => ({
        id: row.id,
        type: row.type,
        message: row.message,
        createdAt: row.createdAt.toISOString(),
      }));
    } catch {
      /* demo fallback */
    }
  }

  const stats = [
    {
      label: "Pending submissions",
      value: pendingSubmissions,
      icon: Inbox,
      href: "/admin/submissions",
    },
    { label: "Games", value: games.length, icon: Gamepad2, href: "/admin/games" },
    { label: "Codes", value: codes.length, icon: Ticket, href: "/admin/codes" },
    { label: "Resources", value: resources.length, icon: BookOpen, href: "/admin/resources" },
    {
      label: "Announcements",
      value: announcements.length,
      icon: Megaphone,
      href: "/admin/announcements",
    },
    { label: "Users", value: userCount, icon: Users, href: "/admin/users" },
    { label: "Tools", value: tools.length, icon: Wrench, href: "/admin/tools" },
    { label: "Rewards", value: activeRewardCount(), icon: Trophy, href: "/admin/rewards" },
    { label: "Badges", value: badges.length, icon: Trophy, href: "/admin/rewards" },
  ];

  return (
    <>
      {!isDatabaseConfigured() && (
        <Alert variant="warning">
          <span className="font-medium">Demo mode.</span> No{" "}
          <code className="font-mono">DATABASE_URL</code> is set, so content edits
          are rejected with a 503. Set up PostgreSQL, run{" "}
          <code className="font-mono">npx prisma db push</code> and redeploy to
          enable writes. Read-only browsing still works.
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex items-center gap-3 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                  <stat.icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xl font-bold">{stat.value}</span>
                  <span className="block truncate text-[0.68rem] uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent admin activity</CardTitle>
            <CardDescription>Audit trail written to the database.</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recorded actions yet
                {!isDatabaseConfigured() ? " (audit log requires a database)" : ""}.
              </p>
            ) : (
              <ul className="space-y-2">
                {recent.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <p className="min-w-0 truncate text-sm">{event.message}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(event.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/logs"
              className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ScrollText className="size-4" /> Full log <ArrowUpRight className="size-3" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Server-side configuration status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              {
                label: "PostgreSQL (DATABASE_URL)",
                ok: isDatabaseConfigured(),
              },
              { label: "Discord OAuth", ok: isOAuthConfigured() },
              {
                label: "Admin allow-list (ADMIN_DISCORD_IDS)",
                ok: adminDiscordIds().length > 0,
                hint: `${adminDiscordIds().length} id(s)`,
              },
              {
                label: "Signed session secret",
                ok: Boolean(process.env.AUTH_SECRET),
                hint: process.env.AUTH_SECRET ? "set" : "ephemeral in production",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
              >
                <span className="text-sm">{row.label}</span>
                <span className="flex items-center gap-2">
                  {row.hint && (
                    <span className="text-xs text-muted-foreground">{row.hint}</span>
                  )}
                  <Badge variant={row.ok ? "success" : "warning"}>
                    {row.ok ? "OK" : "Missing"}
                  </Badge>
                </span>
              </div>
            ))}
            <p className="pt-2 text-xs text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">@{admin.username}</span> ·{" "}
              {formatNumber(userCount)} user{userCount === 1 ? "" : "s"} in the system.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalogue sizes</CardTitle>
          <CardDescription>
            Static seeds merged with database rows — database wins on conflict.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Games", value: games.length },
            { label: "Codes", value: codes.length },
            { label: "Resources", value: resources.length },
            { label: "Announcements", value: announcements.length },
            { label: "Rewards (active)", value: activeRewardCount() },
            { label: "Tools (code registry)", value: tools.length },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
            >
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <span className="font-semibold">{formatNumber(row.value)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
