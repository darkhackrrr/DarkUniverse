"use client";

import Link from "next/link";
import { LayoutDashboard, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DiscordIcon } from "@/components/icons";
import { useSession } from "@/components/session-provider";

/**
 * Standalone sign-in button that becomes a dashboard button once the visitor
 * is authenticated — used where a page only needs the action, not the copy.
 */
export function SignInControl({ label = "Sign in with Discord" }: { label?: string }) {
  const { user, loaded } = useSession();

  if (!loaded) return <Skeleton className="h-9 w-44" aria-hidden />;

  if (user) {
    return (
      <Button asChild>
        <Link href="/dashboard">
          <LayoutDashboard /> Dashboard
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild>
      <a href="/api/auth/login">
        <DiscordIcon /> {label}
      </a>
    </Button>
  );
}

/**
 * Sign-in / dashboard CTA used by the marketing sections. It reads the shared
 * session, so the copy flips once the member is authenticated instead of
 * telling a signed-in user to sign in again.
 */
export function SessionCta() {
  const { user, loaded } = useSession();

  if (!loaded) {
    return (
      <div className="mt-6 space-y-3" aria-hidden>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-44" />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {user
          ? `Signed in as @${user.username} — your points, badges and saved tools live in your dashboard.`
          : "Sign in with Discord to save tools, track badges and unlock rewards."}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {user ? (
          <Button asChild>
            <Link href="/dashboard">
              <LayoutDashboard /> Open dashboard
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <a href="/api/auth/login">Sign in with Discord</a>
          </Button>
        )}
        <Button variant="secondary" asChild>
          <Link href="/rewards">
            <Trophy /> See rewards
          </Link>
        </Button>
      </div>
    </div>
  );
}
