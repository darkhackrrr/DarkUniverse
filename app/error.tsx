"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[darkuniverse] render error:", error);
  }, [error]);

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-destructive/15 text-destructive">
            <TriangleAlert className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Something broke</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              An unexpected error occurred while rendering this page. Retrying
              usually fixes it.
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Reference: {error.digest}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={reset}>
              <RefreshCw /> Try again
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/">
                <Home /> Go home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
