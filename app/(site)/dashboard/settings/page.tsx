import type { Metadata } from "next";
import { Settings, KeyRound, Database, LogOut, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { guardUser } from "@/lib/auth/guards";
import { getDashboardData } from "@/lib/dashboard";
import { getPrisma } from "@/lib/database/client";
import { isOAuthConfigured } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import {
  BioForm,
  ExportDataButton,
  DeleteAccountButton,
} from "@/components/dashboard/settings-forms";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false },
};

export default async function DashboardSettingsPage() {
  const user = await guardUser("/dashboard/settings");
  const data = await getDashboardData(user);

  let storedBio = "";
  const prisma = getPrisma();
  if (prisma) {
    try {
      const row = await prisma.user.findUnique({
        where: { id: user.id },
        select: { bio: true },
      });
      storedBio = row?.bio ?? "";
    } catch {
      storedBio = "";
    }
  } else {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    storedBio = jar.get("du_bio")?.value ?? "";
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-4 text-primary" /> Profile
          </CardTitle>
          <CardDescription>Shown on your dashboard and future public profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <BioForm initial={storedBio} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" /> Session &amp; security
          </CardTitle>
          <CardDescription>
            Your session is a signed, HTTP-only cookie — nothing editable lives
            in the browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Session cookie", value: "du_session (HMAC-SHA256)" },
              { label: "Expires", value: "14 days from sign-in" },
              {
                label: "Sign-in method",
                value: user.discordId ? "Discord OAuth" : "Local demo session",
              },
              {
                label: "Discord OAuth",
                value: isOAuthConfigured() ? "Configured" : "Not configured",
              },
              { label: "Member since", value: formatDate(user.createdAt) },
              { label: "Role", value: user.role },
            ].map((row) => (
              <div key={row.label} className="rounded-lg border border-border bg-surface px-4 py-3">
                <dt className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </dt>
                <dd className="mt-0.5 break-words text-sm font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="outline" asChild>
              <a href="/api/auth/logout">
                <LogOut /> Sign out
              </a>
            </Button>
            <Badge variant="secondary">
              <ShieldCheck /> Server-verified role
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4 text-muted-foreground" /> Your data
          </CardTitle>
          <CardDescription>
            Stored in{" "}
            {data.databaseBacked ? "PostgreSQL" : "a first-party session cookie"}{" "}
            only. No third-party analytics are attached to your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExportDataButton username={user.username} />
          <p className="text-sm text-muted-foreground">
            The export contains your profile, saved tools, earned badges,
            unlocked rewards and recorded activity as JSON.
          </p>
        </CardContent>
      </Card>

      {!data.databaseBacked && (
        <Alert variant="warning">
          <span className="font-medium">Demo mode.</span> No database is
          configured, so this account lives in your browser only. Deleting the
          account here clears local cookies.
        </Alert>
      )}

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete this account and everything attached to it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </>
  );
}
