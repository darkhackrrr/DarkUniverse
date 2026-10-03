import { LogOut, Shield, ArrowUpRight } from "lucide-react";
import { guardUser } from "@/lib/auth/guards";
import { dashboardNav } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { ActiveLink } from "@/components/nav-active-link";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await guardUser("/dashboard");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Your space
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{user.points} pts</Badge>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Shield className="size-3.5" /> Admin panel <ArrowUpRight className="size-3" />
            </Link>
          )}
          <a
            href="/api/auth/logout"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-3.5" /> Sign out
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {dashboardNav.map((item) => (
              <ActiveLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>
          <div className="mt-4 hidden rounded-lg border border-border bg-surface p-4 text-xs text-muted-foreground lg:block">
            <p className="mb-1 font-medium text-foreground">Signed in as</p>
            <p className="truncate">@{user.username}</p>
            <p className="mt-1 truncate">{user.email ?? "No email shared"}</p>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}
