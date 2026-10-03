"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Search, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { navLinks, siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { DiscordIcon } from "@/components/icons";
import { useSession } from "@/components/session-provider";
import { SearchDialog } from "@/components/search-dialog";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, loaded } = useSession();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="glass sticky top-0 z-50 border-b border-border/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold tracking-tight"
          >
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              priority
              className="size-8 rounded-lg object-cover glow-ring"
            />
            <span className="hidden text-[0.95rem] sm:inline">
              {siteConfig.name}
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  isActive(link.href)
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground md:flex"
              aria-label="Search"
            >
              <Search className="size-4" />
              <span>Search…</span>
              <kbd className="ml-2 rounded border border-border bg-secondary px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
                Ctrl K
              </kbd>
            </button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search />
            </Button>

            {!loaded ? (
              <div className="hidden items-center gap-1.5 sm:flex" aria-hidden>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            ) : user ? (
              <div className="hidden items-center gap-1.5 sm:flex">
                {user.role === "ADMIN" && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin">
                      <Shield /> Admin
                    </Link>
                  </Button>
                )}
                <Button variant="secondary" size="sm" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard /> Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="icon-sm" asChild>
                  <a href="/api/auth/logout" aria-label="Sign out" title="Sign out">
                    <LogOut />
                  </a>
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" className="hidden sm:flex" asChild>
                <a href="/api/auth/login">
                  <DiscordIcon /> Sign in
                </a>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {open && (
          <nav className="animate-fade-in border-t border-border bg-surface lg:hidden">
            <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "block rounded-md px-3 py-2.5 text-sm",
                    isActive(link.href)
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3">
                {!loaded ? (
                  <Skeleton className="h-9 w-full" aria-hidden />
                ) : user ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1" asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <a href="/api/auth/logout">Sign out</a>
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" asChild>
                    <a href="/api/auth/login">
                      <DiscordIcon /> Sign in with Discord
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
