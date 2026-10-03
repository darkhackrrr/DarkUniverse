import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { siteConfig, communityLinks } from "@/lib/config";
import { tools } from "@/lib/tools/registry";
import { DiscordIcon, RobloxIcon, YoutubeIcon } from "@/components/icons";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-70" aria-hidden />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, #7c6cf5 55%, transparent) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="animate-fade-up mx-auto max-w-3xl text-center">
          <Badge variant="secondary" className="mb-5 gap-1.5">
            <Sparkles className="size-3 text-primary" />
            {siteConfig.studio} · Community Hub
          </Badge>

          <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-gradient">Everything DarkUniverse,</span>
            <br />
            in one place.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            {tools.length} working tools, live Roblox utilities, creator
            resources and community rewards — built for the DarkUniverse
            community and free to use.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/tools">
                Browse all tools <ArrowRight />
              </Link>
            </Button>
            {communityLinks.discord ? (
              <Button size="lg" variant="secondary" asChild>
                <a
                  href={communityLinks.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DiscordIcon /> Join the Discord
                </a>
              </Button>
            ) : (
              <Button size="lg" variant="secondary" asChild>
                <Link href="/community">
                  <DiscordIcon /> Discord coming soon
                </Link>
              </Button>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-success" />
              Everything runs in your browser where it can
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="size-3.5 text-warning" />
              No sign-up required for tools
            </span>
            <span className="flex items-center gap-1.5">
              <Search className="size-3.5 text-info" />
              Press <kbd className="rounded border border-border bg-secondary px-1 py-0.5">Ctrl K</kbd> to search
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SocialStrip() {
  return (
    <div className="border-b border-border bg-surface/50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 py-5 sm:px-6">
        <span className="mr-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Join us on
        </span>
        {communityLinks.discord ? (
          <Button variant="outline" size="sm" asChild>
            <a
              href={communityLinks.discord}
              target="_blank"
              rel="noopener noreferrer"
            >
              <DiscordIcon /> Discord
            </a>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <DiscordIcon /> Discord — soon
          </Button>
        )}
        <Button variant="outline" size="sm" asChild>
          <a href={communityLinks.youtube} target="_blank" rel="noopener noreferrer">
            <YoutubeIcon /> YouTube
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={communityLinks.robloxGroup} target="_blank" rel="noopener noreferrer">
            <RobloxIcon /> Roblox Group
          </a>
        </Button>
      </div>
    </div>
  );
}
