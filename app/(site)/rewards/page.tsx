import type { Metadata } from "next";
import { Trophy, BadgeCheck, Gift, Lock } from "lucide-react";
import { PageHeader, ContentSection } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { rewards, badges, rarityOrder } from "@/lib/data/rewards";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Rewards",
  description:
    "Earn community points and badges by using the hub, joining Discord and redeeming codes — then claim rewards.",
  alternates: { canonical: "/rewards" },
};

const typeLabels: Record<string, string> = {
  badge: "Badge",
  "discord-role": "Discord role",
  "game-code": "Game code",
  resource: "Resource pack",
  title: "Title",
};

const rarityVariant = {
  common: "secondary",
  rare: "info",
  epic: "default",
  legendary: "warning",
} as const;

export default function RewardsPage() {
  const totalPoints = rewards.filter((r) => r.active).reduce((s, r) => s + r.points, 0);
  const sortedBadges = [...badges].sort(
    (a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity],
  );

  return (
    <>
      <PageHeader
        eyebrow="Progression"
        title="Rewards & badges"
        description="Points are awarded for real actions — saving tools, linking Discord and joining events. Nothing is padded or faked."
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">{rewards.length} rewards</Badge>
          <Badge variant="secondary">{badges.length} badges</Badge>
          <Badge variant="outline">{totalPoints} points available</Badge>
        </div>
      </PageHeader>

      <ContentSection>
        <Alert variant="info" className="mb-8">
          <span className="font-medium">Progress requires a signed-in session.</span>{" "}
          Sign in with Discord on the dashboard to track points, unlocked badges
          and claimed rewards.
        </Alert>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-lg font-semibold">How to earn</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {rewards.map((reward) => (
                  <Card key={reward.id} className={reward.active ? "" : "opacity-60"}>
                    <CardContent className="flex h-full flex-col gap-2 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Gift className="size-4 text-primary" />
                          <h3 className="font-semibold">{reward.name}</h3>
                        </div>
                        <Badge variant="outline">+{reward.points}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                      <Badge variant="secondary" className="mt-auto w-fit">
                        {typeLabels[reward.type] ?? reward.type}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold">Badges</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {sortedBadges.map((badge) => (
                  <Card key={badge.id}>
                    <CardContent className="flex h-full flex-col gap-2 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <BadgeCheck className="size-5 text-primary" />
                        <Badge variant={rarityVariant[badge.rarity]} className="capitalize">
                          {badge.rarity}
                        </Badge>
                      </div>
                      <h3 className="font-semibold">{badge.name}</h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {badge.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="size-4 text-warning" /> Point tiers
                </CardTitle>
                <CardDescription>What each milestone unlocks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { points: 50, label: "Newcomer", perk: "Welcome badge" },
                  { points: 150, label: "Regular", perk: "Custom profile colour" },
                  { points: 300, label: "Veteran", perk: "Veteran role in Discord" },
                  { points: 500, label: "Legend", perk: "Legend of the Void badge" },
                ].map((tier) => (
                  <div
                    key={tier.points}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{tier.label}</p>
                      <p className="text-xs text-muted-foreground">{tier.perk}</p>
                    </div>
                    <Badge variant="default">{tier.points} pts</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="size-4 text-muted-foreground" /> Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  YouTube subscription checks are intentionally not simulated —
                  a reward only shows as verified once a real API check exists.
                </p>
                <p>
                  Discord-linked rewards use your signed-in session, so they can
                  be verified server-side.
                </p>
                <Button className="mt-2 w-full" asChild>
                  <a href="/dashboard">Open your dashboard</a>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </ContentSection>
    </>
  );
}
