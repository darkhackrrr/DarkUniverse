import Link from "next/link";
import Image from "next/image";
import { Gamepad2, Wrench, BookOpen, Megaphone, Users, Gift } from "lucide-react";
import { siteConfig, communityLinks, navLinks } from "@/lib/config";
import { DiscordIcon, YoutubeIcon, RobloxIcon } from "@/components/icons";
import { Separator } from "@/components/ui/separator";

const columns = [
  {
    title: "Explore",
    links: [
      { href: "/tools", label: "All tools", icon: Wrench },
      { href: "/games", label: "Games", icon: Gamepad2 },
      { href: "/codes", label: "Game codes", icon: Gift },
      { href: "/resources", label: "Resources", icon: BookOpen },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/community", label: "Community hub", icon: Users },
      { href: "/rewards", label: "Rewards", icon: Gift },
      { href: "/updates", label: "Updates", icon: Megaphone },
      { href: "/dashboard", label: "Dashboard", icon: Users },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-lg object-cover"
              />
              <span className="font-semibold tracking-tight">{siteConfig.name}</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {siteConfig.tagline}
            </p>
            <div className="flex gap-2">
              {communityLinks.discord ? (
                <a
                  href={communityLinks.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord server"
                  className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <DiscordIcon className="size-4" />
                </a>
              ) : (
                <span
                  aria-label="Discord server — coming soon"
                  title="Discord server — coming soon"
                  className="grid size-9 place-items-center rounded-md border border-dashed border-border text-muted-foreground/50"
                >
                  <DiscordIcon className="size-4" />
                </span>
              )}
              <a
                href={communityLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube channel"
                className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <YoutubeIcon className="size-4" />
              </a>
              <a
                href={communityLinks.robloxGroup}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Roblox group"
                className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                <RobloxIcon className="size-4" />
              </a>
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-3 text-sm font-semibold">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <link.icon className="size-3.5" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-3 text-sm font-semibold">Directory</h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.studio}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <a
              href="https://dev.roblox.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Roblox
            </a>
          </div>
        </div>
        <p className="mt-4 text-[0.7rem] leading-relaxed text-muted-foreground/70">
          DarkUniverse Hub is an independent community project and is not
          affiliated with, endorsed by or sponsored by Roblox Corporation or
          Discord Inc. Roblox and the Roblox logo are trademarks of Roblox
          Corporation.
        </p>
      </div>
    </footer>
  );
}
