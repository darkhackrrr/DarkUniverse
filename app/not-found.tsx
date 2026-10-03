import Link from "next/link";
import { Compass, Search, Wrench, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const suggestions = [
  { href: "/tools", label: "Browse all tools", icon: Wrench },
  { href: "/games", label: "See the games", icon: Gamepad2 },
  { href: "/codes", label: "Grab a code", icon: Search },
  { href: "/updates", label: "Read updates", icon: Compass },
];

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center px-4">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" aria-hidden />
      <Card className="relative w-full max-w-lg">
        <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
          <span className="text-6xl font-bold leading-none text-primary">404</span>
          <div>
            <h1 className="text-xl font-semibold">This page drifted off</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist, moved, or the
              link is out of date.
            </p>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-2">
            {suggestions.map((item) => (
              <Button key={item.href} variant="secondary" asChild>
                <Link href={item.href}>
                  <item.icon /> {item.label}
                </Link>
              </Button>
            ))}
          </div>

          <Button asChild>
            <Link href="/">Back to the hub</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
