import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { siteConfig, isOAuthConfigured, isDatabaseConfigured } from "@/lib/config";
import { DiscordIcon } from "@/components/icons";
import { DemoLoginForm } from "@/components/auth/demo-login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${siteConfig.name} with Discord to save tools, track points and unlock rewards.`,
  robots: { index: false },
};

const benefits = [
  "Save your favourite tools to the dashboard",
  "Earn points and unlock badges over time",
  "Redeem codes with one click",
  "See your activity history",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const oauth = isOAuthConfigured();
  const demoAllowed = !oauth || process.env.ALLOW_DEMO_LOGIN === "true";

  const errorMessages: Record<string, string> = {
    oauth_not_configured:
      "Discord sign-in isn't configured yet — add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET to your environment, or use the demo sign-in below.",
    oauth_denied: "Discord sign-in was cancelled. Try again whenever you like.",
    oauth_failed:
      "Something went wrong completing the Discord handshake. Please try again.",
    invalid_state:
      "The sign-in link expired or was already used. Start again from the login page.",
    missing_code: "Discord didn't return an authorisation code. Try again.",
    unavailable: "Sign-in is temporarily unavailable.",
  };

  const errorMessage = params.error ? errorMessages[params.error] ?? errorMessages.unavailable : null;
  const next = params.next ?? "/dashboard";

  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        className="pointer-events-none absolute inset-0 grid-bg opacity-60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[380px] w-[640px] -translate-x-1/2 rounded-full opacity-40 blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, #7c6cf5 55%, transparent), transparent 70%)",
        }}
        aria-hidden
      />

      <header className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <Image
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-lg object-cover"
          />
          {siteConfig.name}
        </Link>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeft /> Back to site
          </Link>
        </Button>
      </header>

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        <Card className="glow-ring">
          <CardHeader>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Use your Discord account to track progress across{" "}
              {siteConfig.name}.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {errorMessage && <Alert variant="destructive">{errorMessage}</Alert>}

            {oauth ? (
              <Button className="w-full" size="lg" asChild>
                <a
                  href={`/api/auth/login?next=${encodeURIComponent(next)}`}
                >
                  <DiscordIcon /> Continue with Discord
                </a>
              </Button>
            ) : (
              <Alert variant="warning">
                <span className="font-medium">Discord OAuth not configured.</span>{" "}
                Set <code className="font-mono">DISCORD_CLIENT_ID</code> and{" "}
                <code className="font-mono">DISCORD_CLIENT_SECRET</code> to enable
                it. Until then you can use the demo sign-in.
              </Alert>
            )}

            {!isDatabaseConfigured() && (
              <Alert variant="info">
                <span className="font-medium">No database configured.</span>{" "}
                Sessions will work, but points, saved tools and admin changes
                won&apos;t persist across restarts until{" "}
                <code className="font-mono">DATABASE_URL</code> is set.
              </Alert>
            )}

            {demoAllowed && (
              <>
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    or
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <DemoLoginForm />
              </>
            )}

            <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ShieldCheck className="size-3.5 text-success" /> Why sign in
              </p>
              <ul className="space-y-1.5">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 size-1 rounded-full bg-primary" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Every check happens on the server — admin and role enforcement is
              never trusted to the browser.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
