import Link from "next/link";
import { ArrowLeft, Shield, Database } from "lucide-react";
import { guardAdmin } from "@/lib/auth/guards";
import { adminNav } from "@/lib/config";
import { ActiveLink } from "@/components/nav-active-link";
import { Badge } from "@/components/ui/badge";
import { isDatabaseConfigured, isOAuthConfigured } from "@/lib/config";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await guardAdmin("/admin");
  const database = isDatabaseConfigured();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-warning">
            <Shield className="size-3.5" /> Administrator
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Admin panel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as <span className="font-medium">@{admin.username}</span> ·
            server-verified on every request
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={database ? "success" : "warning"}>
            <Database className="size-3" />
            {database ? "Database connected" : "Demo storage"}
          </Badge>
          <Badge variant="outline">
            OAuth {isOAuthConfigured() ? "configured" : "not configured"}
          </Badge>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Dashboard
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {adminNav.map((item) => (
              <ActiveLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>
        </aside>
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}
