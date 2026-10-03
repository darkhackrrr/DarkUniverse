import type { Metadata } from "next";
import { Trophy, Lock, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { guardUser } from "@/lib/auth/guards";
import { getDashboardData } from "@/lib/dashboard";
import { activeRewardCount } from "@/lib/data/rewards";

export const metadata: Metadata = {
  title: "Rewards",
  robots: { index: false },
};

const typeLabel: Record<string, string> = {
  badge: "Badge",
  "discord-role": "Discord role",
  "game-code": "Game code",
  resource: "Resource pack",
  title: "Community title",
};

export default async function DashboardRewardsPage() {
  const user = await guardUser("/dashboard/rewards");
  const data = await getDashboardData(user);

  const earned = data.rewardStates.filter((r) => r.earned);

  return (
    <>
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-4 text-warning" /> Points balance
          </CardTitle>
          <CardDescription>
            Reward points plus 5 points for every badge you&apos;ve earned.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-6">
          <div>
            <p className="text-4xl font-bold text-gradient">{data.points}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              total points
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{data.rewardPoints}</p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              from rewards
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold">
              {earned.length}/{activeRewardCount()}
            </p>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              rewards unlocked
            </p>
          </div>
          {data.nextReward && (
            <div>
              <p className="text-2xl font-semibold">
                {Math.max(0, data.nextReward.points - data.points)}
              </p>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                to {data.nextReward.name}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All rewards</CardTitle>
          <CardDescription>
            Rewards unlock automatically when their requirement is met — there is
            no manual claim step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {data.rewardStates.map((reward) => (
              <div
                key={reward.id}
                className={`rounded-lg border p-4 ${
                  reward.earned
                    ? "border-success/40 bg-success/5"
                    : "border-border bg-surface"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{reward.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {reward.description}
                    </p>
                  </div>
                  <Badge variant={reward.earned ? "success" : "secondary"}>
                    +{reward.points}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">{typeLabel[reward.type] ?? reward.type}</Badge>
                  <span
                    className={`inline-flex items-center gap-1 ${
                      reward.earned ? "text-success" : "text-muted-foreground"
                    }`}
                  >
                    {reward.earned ? <Check className="size-3.5" /> : <Lock className="size-3.5" />}
                    {reward.earned ? "Unlocked" : reward.requirement}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Alert variant="info">
        <span className="font-medium">Honest tracking.</span> Rewards that need
        upstream checks we haven&apos;t shipped (code redemption, resource packs)
        stay locked instead of granting themselves.
      </Alert>
    </>
  );
}
