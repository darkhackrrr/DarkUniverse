import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, AtSign, Calendar, BadgeCheck, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { guardUser } from "@/lib/auth/guards";
import { getPrisma } from "@/lib/database/client";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false },
};

export default async function ProfilePage() {
  const user = await guardUser("/dashboard/profile");

  let accounts: Array<{ provider: string; providerAccountId: string }> = [];
  const prisma = getPrisma();
  if (prisma) {
    try {
      const rows = await prisma.account.findMany({
        where: { userId: user.id },
        select: { provider: true, providerAccountId: true },
      });
      accounts = rows;
    } catch {
      accounts = [];
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary">
              {user.image ? (
                 
                <img src={user.image} alt="" className="size-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary">
                  {user.username.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <CardTitle>{user.name ?? user.username}</CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <AtSign className="size-3.5" /> {user.username}
              </CardDescription>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                  {user.role === "ADMIN" ? "Administrator" : "Member"}
                </Badge>
                {user.discordId && (
                  <Badge variant="info">
                    <BadgeCheck /> Discord linked
                  </Badge>
                )}
                <Badge variant="outline">{user.points} pts</Badge>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Roblox profile linking is not enabled yet"
          >
            <ExternalLink /> Link Roblox
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "User ID", value: user.id, mono: true },
              { label: "Email", value: user.email ?? "Not shared" },
              { label: "Discord ID", value: user.discordId ?? "Not linked", mono: Boolean(user.discordId) },
              {
                label: "Member since",
                value: `${formatDate(user.createdAt)} (${formatRelativeTime(user.createdAt)})`,
              },
              {
                label: "Bot verified",
                value: user.isBotVerified ? "Yes" : "Not yet",
              },
              {
                label: "Session type",
                value: user.discordId ? "Discord OAuth" : "Local demo session",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="rounded-lg border border-border bg-surface px-4 py-3"
              >
                <dt className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </dt>
                <dd className={`mt-0.5 break-words text-sm font-medium ${row.mono ? "font-mono" : ""}`}>
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected accounts</CardTitle>
          <CardDescription>
            Providers linked to this profile. Sign-in providers appear
            automatically after OAuth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {accounts.length === 0 ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Shield className="size-4" />
                {user.discordId
                  ? "Discord is your sign-in provider."
                  : "No OAuth providers linked yet."}
              </div>
              {!user.discordId && (
                <Button size="sm" asChild>
                  <a href="/api/auth/login">Link Discord</a>
                </Button>
              )}
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={`${account.provider}-${account.providerAccountId}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium capitalize">{account.provider}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {account.providerAccountId}
                  </p>
                </div>
                <Badge variant="success">Connected</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {!user.discordId && (
        <Alert variant="info">
          <span className="font-medium">You&apos;re using a local session.</span>{" "}
          Sign in with Discord to sync points and badges across devices.{" "}
          <Link href="/login" className="underline">
            Go to sign-in
          </Link>
          .
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" /> Identity rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Roles are resolved server-side on every request: an administrator is
            either listed in <code className="font-mono">ADMIN_DISCORD_IDS</code>{" "}
            or flagged in the database — never by a client-supplied claim.
          </p>
          <p>
            The session cookie is HMAC-signed and expires after 14 days. It
            cannot be edited in the browser.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
