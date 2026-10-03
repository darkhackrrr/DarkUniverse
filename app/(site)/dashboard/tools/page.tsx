import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { guardUser } from "@/lib/auth/guards";
import { getDashboardData } from "@/lib/dashboard";
import { SavedToolsList } from "@/components/dashboard/saved-tools";

export const metadata: Metadata = {
  title: "Saved tools",
  robots: { index: false },
};

export default async function DashboardToolsPage() {
  const user = await guardUser("/dashboard/tools");
  const data = await getDashboardData(user);

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="size-4 text-primary" /> Saved tools
            </CardTitle>
            <CardDescription>
              {data.savedTools.length} pinned tool
              {data.savedTools.length === 1 ? "" : "s"} · stored in{" "}
              {data.databaseBacked ? "PostgreSQL" : "a session cookie"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SavedToolsList initial={data.savedTools} />
        </CardContent>
      </Card>

      {!data.databaseBacked && (
        <Alert variant="warning">
          <span className="font-medium">Demo storage.</span> Without{" "}
          <code className="font-mono">DATABASE_URL</code> saved tools live in a
          cookie and are tied to this browser only.
        </Alert>
      )}
    </>
  );
}
