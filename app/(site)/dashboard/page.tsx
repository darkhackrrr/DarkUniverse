import type { Metadata } from "next";
import Link from "next/link";
import {
  Trophy,
  Bookmark,
  Sparkles,
  ArrowRight,
  Clock,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { guardUser } from "@/lib/auth/guards";
import { getDashboardData } from "@/lib/dashboard";
import { VerifyCard } from "@/components/dashboard/verify-card";
import { readVerifyStatus } from "@/lib/verify";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import { activeRewardCount } from "@/lib/data/rewards";

export const metadata: Metadata = {
  title: "Overview",
  robots: { index: false },
};

export default async function DashboardOverviewPage() {
  const user = await guardUser("/dashboard");
  const [data, verify] = await Promise.all([
    getDashboardData(user),
    readVerifyStatus(user.id),
  ]);

  const stats = [
    {
      label: "Points",
      value: formatNumber(data.points),
      icon: Trophy,
      href: "/dashboard/rewards",
      tone: "text-warning",
    },
    {
      label: "Saved tools",
      value: data.savedTools.length,
      icon: Bookmark,
      href: "/dashboard/tools",
      tone: "text-primary",
    },
    {
      label: "Badges earned",
      value: data.badgeStates.filter((b) => b.earned).length,
      icon: Star,
      href: "/dashboard/badges",
      tone: "text-info",
    },
    {
      label: "Activity events",
      value: data.activity.length,
      icon: Clock,
      href: "/dashboard/settings",
      tone: "text-success",
    },
  ];

  return (
    <>
      {!data.databaseBacked && (
        <Alert variant="warning">
          <span className="font-medium">Demo storage in use.</span> No{" "}
          <code className="font-mono">DATABASE_URL</code> is configured, so your
          saved tools live in a cookie and will reset when you clear site data.
          Set up PostgreSQL and redeploy for permanent progress.
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex items-center gap-4 p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
                  <stat.icon className="size-5" />
                </span>
                <span>
                  <span className={`block text-2xl font-bold ${stat.tone}`}>
                    {stat.value}
                  </span>
                  <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>What you've done on the Hub.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {data.activity.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
                  <Sparkles className="mx-auto mb-2 size-5 text-muted-foreground" />
                  <p className="text-sm font-medium">No activity yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    Save a tool, browse the games or redeem a code and it will
                    show up here.
                  </p>
                  <Button size="sm" variant="outline" className="mt-4" asChild>
                    <Link href="/tools">
                      Browse tools <ArrowRight />
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.activity.slice(0, 8).map((event) => (
                    <li
                      key={event.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm">{event.message}</p>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {event.type}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(event.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Saved tools</CardTitle>
                <CardDescription>Your shortcuts.</CardDescription>
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/tools">
                  Manage <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.savedTools.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing saved yet — hit Save on any tool page.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.savedTools.slice(0, 8).map((tool) => (
                    <Link key={tool.slug} href={tool.href ?? "/tools"}>
                      <Badge variant="secondary" className="hover:border-primary/40">
                        {tool.name ?? tool.slug}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <VerifyCard initial={verify} />

          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-4 text-warning" /> Next reward
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.nextReward ? (
                <>
                  <p className="font-medium">{data.nextReward.name}</p>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((data.points / data.nextReward.points) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.points}/{data.nextReward.points} points
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You&apos;ve earned every currently available reward — new ones
                  land with each content drop.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {data.rewardStates.filter((r) => r.earned).length} of{" "}
                {activeRewardCount()} rewards unlocked.
              </p>
              <Button size="sm" variant="secondary" className="w-full" asChild>
                <Link href="/dashboard/rewards">View rewards</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> Latest badges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.badgeStates.slice(0, 5).map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{badge.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {badge.earned ? badge.reason : "Locked"}
                    </p>
                  </div>
                  <Badge variant={badge.earned ? "default" : "secondary"}>
                    {badge.earned ? "Earned" : badge.rarity}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
