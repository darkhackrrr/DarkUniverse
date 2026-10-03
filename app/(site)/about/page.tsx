import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, Users, Gamepad2, ShieldCheck } from "lucide-react";
import { PageHeader, ContentSection } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { siteConfig, communityLinks } from "@/lib/config";
import { tools } from "@/lib/tools/registry";
import { listGames } from "@/lib/content";
import { SignInControl } from "@/components/auth/session-cta";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "About",
  description:
    "What DarkUniverse Hub is, how it's built, and what we promise about your data.",
  alternates: { canonical: "/about" },
};

const principles = [
  {
    icon: Wrench,
    title: "Tools that work",
    body: "Every tool on the site does real work. If something can't be implemented honestly — like a live service we don't control — we say so instead of faking a result.",
  },
  {
    icon: ShieldCheck,
    title: "Your data stays yours",
    body: "Image and text tools run entirely in your browser. We don't upload your files, and we don't log the inputs you type into client-side tools.",
  },
  {
    icon: Users,
    title: "Community first",
    body: "The hub exists because the community asked for one place for codes, resources and utilities. Requests land in #tools-feedback and shape the roadmap.",
  },
  {
    icon: Gamepad2,
    title: "Built by players",
    body: "The same team that builds the games builds this site — so update notes, codes and tools all arrive together.",
  },
];

export default async function AboutPage() {
  const games = await listGames();
  return (
    <>
      <PageHeader
        eyebrow="About"
        title={siteConfig.name}
        description={siteConfig.description}
      >
        <div className="flex flex-wrap gap-3">
          <SignInControl label="Sign in" />
          {communityLinks.discord ? (
            <Button variant="secondary" asChild>
              <a
                href={communityLinks.discord}
                target="_blank"
                rel="noopener noreferrer"
              >
                Talk to the team
              </a>
            </Button>
          ) : (
            <Button variant="secondary" asChild>
              <Link href="/community">Community — coming soon</Link>
            </Button>
          )}
        </div>
      </PageHeader>

      <ContentSection>
        <div className="grid gap-4 md:grid-cols-2">
          {principles.map((p) => (
            <Card key={p.title}>
              <CardHeader>
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
                  <p.icon className="size-5" />
                </span>
                <CardTitle className="mt-2">{p.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {p.body}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>What&apos;s inside</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">{tools.length} tools</strong>{" "}
                across Roblox, Discord, YouTube, image processing and everyday
                utilities.
              </p>
              <p>
                <strong className="text-foreground">
                  {games.length} {games.length === 1 ? "game" : "games"}
                </strong>{" "}
                with pages that pull live stats straight from Roblox.
              </p>
              <p>
                A <strong className="text-foreground">codes directory</strong>,
                a curated{" "}
                <strong className="text-foreground">resource library</strong>,
                announcements and a rewards system for signed-in members.
              </p>
              <p>
                Everything is served by a Next.js app on Vercel with a
                PostgreSQL database (Prisma) for accounts, saved tools and
                activity — falling back to static content when no database is
                configured.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                DarkUniverse Hub is an independent community project. It is not
                affiliated with, endorsed by or sponsored by Roblox Corporation
                or Discord Inc.
              </p>
              <p>
                Community links point at the real DarkUniverse channels; game
                entries and codes are edited in one place in the repository so
                they can be updated without touching page code.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/tools">Browse tools</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/updates">Read updates</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/privacy">Privacy</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ContentSection>
    </>
  );
}
