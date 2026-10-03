import type { Metadata } from "next";
import { Star, Lock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { guardUser } from "@/lib/auth/guards";
import { getDashboardData } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Badges",
  robots: { index: false },
};

const rarityVariant: Record<string, "default" | "secondary" | "info" | "warning"> = {
  common: "secondary",
  rare: "info",
  epic: "default",
  legendary: "warning",
};

export default async function DashboardBadgesPage() {
  const user = await guardUser("/dashboard/badges");
  const data = await getDashboardData(user);
  const earnedCount = data.badgeStates.filter((b) => b.earned).length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="size-4 text-warning" /> Badge collection
          </CardTitle>
          <CardDescription>
            {earnedCount} of {data.badgeStates.length} earned · 5 points per badge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.badgeStates.map((badge) => (
              <div
                key={badge.id}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  badge.earned
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-surface opacity-80",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-lg",
                        badge.earned ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {badge.earned ? <Sparkles className="size-4" /> : <Lock className="size-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{badge.name}</p>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                    </div>
                  </div>
                  <Badge variant={rarityVariant[badge.rarity] ?? "secondary"}>
                    {badge.rarity}
                  </Badge>
                </div>
                <p
                  className={cn(
                    "mt-3 text-xs",
                    badge.earned ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {badge.earned ? `Unlocked — ${badge.reason}` : `Locked — ${badge.reason}`}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
