import type { Metadata } from "next";
import Link from "next/link";
import { Users, Gamepad2, MessageSquare, ShieldCheck, Trophy, Wrench } from "lucide-react";
import { PageHeader, ContentSection } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { communityLinks, communityStats, siteConfig } from "@/lib/config";
import { tools } from "@/lib/tools/registry";
import { DiscordIcon, YoutubeIcon, RobloxIcon } from "@/components/icons";
import { SignInControl } from "@/components/auth/session-cta";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Join the DarkUniverse community on YouTube and Roblox — links, stats and what is coming next, including the Discord server.",
  alternates: { canonical: "/community" },
};

const channels = [
  { name: "#announcements", purpose: "Releases, codes and site updates", locked: true },
  { name: "#roblox-discussion", purpose: "Talk about every DarkUniverse experience" },
  { name: "#tools-feedback", purpose: "Report bugs and request new tools" },
  { name: "#creator-lounge", purpose: "Thumbnails, editing and growth talk" },
  { name: "#showcase", purpose: "Post what you've built" },
  { name: "#giveaways", purpose: "Codes, roles and seasonal events" },
];

const staff = [
  {
    name: "DarkUniverse Studios",
    role: "Founder",
    note: "Builds the games, the tools and this site.",
  },
];

const events = [
  {
    title: "Discord server",
    when: "Opening soon",
    detail: "Voice chats, support and code drops — coming to this page first.",
  },
  {
    title: "YouTube uploads",
    when: "On YouTube",
    detail: "Devlogs, clips and community videos on the DarkUniverse channel.",
  },
  {
    title: "Game updates",
    when: "As they ship",
    detail: "Patch notes for Troll Tower: Impossible Obby land in /updates.",
  },
];

export default function CommunityPage() {
  const stats = [
    {
      label: "Discord members",
      value: communityStats.discordMembers,
      icon: MessageSquare,
    },
    {
      label: "YouTube subscribers",
      value: communityStats.youtubeSubscribers,
      icon: YoutubeIcon,
    },
    {
      label: "Roblox group members",
      value: communityStats.robloxGroupMembers,
      icon: Gamepad2,
    },
    { label: "Tools in the hub", value: tools.length, icon: Wrench },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Join the DarkUniverse"
        description="Follow on YouTube and Roblox today — the Discord server opens soon, with rewards for showing up."
      />

      <ContentSection>
        {/* Socials */}
        <div className="grid gap-4 md:grid-cols-3">
          <SocialCard
            icon={<DiscordIcon className="size-6" />}
            title="Discord server"
            stat={
              communityLinks.discord
                ? `${formatNumber(communityStats.discordMembers ?? 0)} members`
                : "Coming soon"
            }
            description="Daily discussion, code drops, support and voice chats."
            href={communityLinks.discord}
            cta={communityLinks.discord ? "Join server" : "Opening soon"}
            accent="border-primary/40"
          />
          <SocialCard
            icon={<YoutubeIcon className="size-6" />}
            title="YouTube channel"
            stat={`${formatNumber(communityStats.youtubeSubscribers)} subscribers`}
            description="Update videos, devlogs and community highlights."
            href={communityLinks.youtube}
            cta="Subscribe"
          />
          <SocialCard
            icon={<RobloxIcon className="size-6" />}
            title="Roblox group"
            stat={`${formatNumber(communityStats.robloxGroupMembers)} ${
              communityStats.robloxGroupMembers === 1 ? "member" : "members"
            }`}
            description="Group-only events, shoutouts and release news."
            href={communityLinks.robloxGroup}
            cta="Join group"
          />
        </div>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
                  <stat.icon className="size-5" />
                </span>
                <span>
                  <span className="block text-2xl font-bold">
                    {stat.value === null
                      ? "Coming soon"
                      : formatNumber(stat.value)}
                  </span>
                  <span className="block text-xs uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </span>
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Planned channels</CardTitle>
              <CardDescription>
                What the server will look like when it opens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {channels.map((channel) => (
                <div
                  key={channel.name}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm">{channel.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{channel.purpose}</p>
                  </div>
                  {channel.locked && <Badge variant="secondary">Read only</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What's coming</CardTitle>
              <CardDescription>
                Planned for the community in the next few weeks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.map((event) => (
                <div key={event.title} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{event.title}</p>
                    <Badge variant="outline">{event.when}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-success" /> The team
            </CardTitle>
            <CardDescription>
              Solo, volunteer-led — always happy to answer in #tools-feedback
              once the Discord opens.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {staff.map((member) => (
              <div key={member.name} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{member.name}</p>
                  <Badge variant={member.role === "Founder" ? "default" : "secondary"}>
                    {member.role}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{member.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mt-6 border-primary/30">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <Trophy className="size-8 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Earn while you hang out</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                Sign in with Discord to collect points, unlock badges and claim
                rewards — {siteConfig.name} tracks what you've earned across the
                whole community.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <SignInControl />
              {communityLinks.discord ? (
                <Button variant="secondary" asChild>
                  <a
                    href={communityLinks.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Users /> Just browse the server
                  </a>
                </Button>
              ) : (
                <Button variant="secondary" asChild>
                  <Link href="/community">
                    <Users /> See what's coming
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </ContentSection>
    </>
  );
}

function SocialCard({
  icon,
  title,
  stat,
  description,
  href,
  cta,
  accent = "border-border",
}: {
  icon: React.ReactNode;
  title: string;
  stat: string;
  description: string;
  href: string | null;
  cta: string;
  accent?: string;
}) {
  return (
    <Card className={accent}>
      <CardContent className="flex h-full flex-col gap-3 p-6">
        <span className="text-primary">{icon}</span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat}</p>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        {href ? (
          <Button className="mt-auto" variant="secondary" asChild>
            <a href={href} target="_blank" rel="noopener noreferrer">
              {cta}
            </a>
          </Button>
        ) : (
          <Button className="mt-auto" variant="secondary" disabled>
            {cta}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
