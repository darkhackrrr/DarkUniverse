import Link from "next/link";
import {
  ArrowRight,
  Gamepad2,
  Gift,
  Megaphone,
  Wrench,
  Users,
  BookOpen,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SessionCta } from "@/components/auth/session-cta";
import { Hero, SocialStrip } from "@/components/home/hero";
import { Section, SectionHeading, ToolCard } from "@/components/section";
import { featuredTools, tools } from "@/lib/tools/registry";
import { listAnnouncements, listCodes, listGames, listResources } from "@/lib/content";
import { formatDate, formatNumber } from "@/lib/utils";

/** Catalogue sections render from the database (falling back to seeds). */
export const revalidate = 0;

export default async function HomePage() {
  const [games, gameCodes, resources, announcements] = await Promise.all([
    listGames(),
    listCodes(),
    listResources(),
    listAnnouncements(),
  ]);

  const featured = featuredTools(8);
  const activeCodes = gameCodes.filter((c) => c.status === "active");
  const topGames = games.filter((g) => g.status === "Live").slice(0, 3);
  const latest = [...announcements]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);
  const featuredResources = resources.filter((r) => r.featured).slice(0, 4);

  const stats = [
    { label: "Tools", value: tools.length, icon: Wrench, href: "/tools" },
    { label: "Live games", value: topGames.length || games.length, icon: Gamepad2, href: "/games" },
    { label: "Active codes", value: activeCodes.length, icon: Gift, href: "/codes" },
    { label: "Resources", value: resources.length, icon: BookOpen, href: "/resources" },
  ];

  return (
    <>
      <Hero />
      <SocialStrip />

      {/* Stats */}
      <Section className="!py-10">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
                    <stat.icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-2xl font-bold">
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
      </Section>

      {/* Featured tools */}
      <Section>
        <SectionHeading
          eyebrow="Toolkit"
          title={`${tools.length} tools that actually work`}
          description="Roblox lookups, Discord builders, image processors and text utilities — no fake buttons, no uploads for image tools."
          href="/tools"
          cta="All tools"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </Section>

      {/* Games */}
      <Section className="border-y border-border bg-surface/40">
        <SectionHeading
          eyebrow="Experiences"
          title="Games from DarkUniverse Studios"
          description="Live Roblox experiences with live stats and direct play links."
          href="/games"
          cta="All games"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {topGames.map((game) => (
            <Link key={game.id} href={`/games/${game.slug}`} className="group block">
              <Card className="h-full overflow-hidden transition-colors group-hover:border-primary/40">
                <div className="relative aspect-video bg-gradient-to-br from-primary/25 via-secondary to-background">
                  <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
                  <span className="absolute left-3 top-3">
                    <Badge className="border-transparent bg-black/60 text-white backdrop-blur">
                      {game.status}
                    </Badge>
                  </span>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold group-hover:text-foreground">
                      {game.name}
                    </h3>
                    <Badge variant="secondary">{game.genre}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {game.description}
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="size-3.5 text-success" />
                    {game.players > 0
                      ? `${formatNumber(game.players)} playing now`
                      : "Live on Roblox"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* Codes + Resources */}
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="Codes"
              title="Active game codes"
              description="Redeemable codes verified against the latest patch."
              href="/codes"
              cta="All codes"
            />
            <div className="space-y-3">
              {activeCodes.length === 0 ? (
                <Card>
                  <CardContent className="p-5 text-sm text-muted-foreground">
                    No active codes right now — when Troll Tower drops one, it
                    will appear here first.
                  </CardContent>
                </Card>
              ) : (
                activeCodes.slice(0, 5).map((code) => (
                  <Card key={code.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold tracking-wide">
                          {code.code}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {code.reward}
                          {code.gameName ? ` · ${code.gameName}` : ""}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {code.expiresAt
                          ? `Ends ${formatDate(code.expiresAt)}`
                          : "No expiry"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow="Library"
              title="Creator resources"
              description="Docs, communities and tooling we actually use."
              href="/resources"
              cta="All resources"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {featuredResources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <Card className="h-full transition-colors group-hover:border-primary/40">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold">{resource.name}</h3>
                        <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {resource.description}
                      </p>
                      <Badge variant="secondary" className="mt-3">
                        {resource.category}
                      </Badge>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Updates */}
      <Section className="border-t border-border bg-surface/40">
        <SectionHeading
          eyebrow="Changelog"
          title="Latest updates"
          href="/updates"
          cta="All updates"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {latest.map((post) => (
            <Link key={post.slug} href={`/updates/${post.slug}`} className="group block">
              <Card className="h-full transition-colors group-hover:border-primary/40">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold leading-snug">{post.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {post.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* Community / rewards CTA */}
      <Section>
        <Card className="relative overflow-hidden border-primary/30">
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-40 blur-[90px]"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, #7c6cf5 60%, transparent), transparent 70%)",
            }}
            aria-hidden
          />
          <CardContent className="relative grid gap-8 p-8 md:grid-cols-3 lg:p-12">
            <div className="md:col-span-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
                Rewards
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Earn points for being part of the community
              </h2>
              <SessionCta />
            </div>

            <div className="space-y-3">
              {[
                { icon: Trophy, label: "Badges & titles" },
                { icon: Gift, label: "Game codes & perks" },
                { icon: Megaphone, label: "Early announcements" },
                { icon: Users, label: "Member-only events" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface/70 px-4 py-3 text-sm"
                >
                  <item.icon className="size-4 text-primary" />
                  {item.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
