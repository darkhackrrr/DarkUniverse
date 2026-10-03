import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { guardAdmin } from "@/lib/auth/guards";
import { rewards, badges, rarityOrder } from "@/lib/data/rewards";
import { AdminResourceTable } from "@/components/admin/admin-resource-table";
import type { FieldSpec } from "@/components/admin/data-table";

export const metadata: Metadata = {
  title: "Rewards & badges",
  robots: { index: false },
};

const noFields: FieldSpec[] = [];

export default async function AdminRewardsPage() {
  await guardAdmin("/admin/rewards");

  const rewardRows = rewards.map((reward) => ({
    id: reward.id,
    name: reward.name,
    description: reward.description,
    type: reward.type,
    points: reward.points,
    active: reward.active,
  }));

  const sortedBadges = [...badges].sort(
    (a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity],
  );

  return (
    <>
      <Alert variant="info">
        <span className="font-medium">Read-only.</span> Reward and badge
        definitions are code-owned so that the unlock rules in{" "}
        <code className="font-mono">lib/dashboard.ts</code> always match what is
        offered. Edit <code className="font-mono">lib/data/rewards.ts</code> and
        redeploy to change them.
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Rewards</CardTitle>
          <CardDescription>
            {rewards.filter((r) => r.active).length} active of {rewards.length} defined.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminResourceTable
            resource="rewards"
            title="Reward"
            createLabel="New reward"
            rows={rewardRows}
            fields={noFields}
            readonly
            readonlyNote="Defined in code — see the notice above."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>{badges.length} badges worth 5 points each.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedBadges.map((badge) => (
              <div
                key={badge.id}
                className="rounded-lg border border-border bg-surface px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{badge.name}</p>
                  <Badge variant={badge.rarity === "legendary" ? "warning" : "secondary"}>
                    {badge.rarity}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{badge.description}</p>
                <code className="mt-1 block text-[0.68rem] text-muted-foreground">
                  {badge.id}
                </code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
