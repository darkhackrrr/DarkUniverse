import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { guardAdmin } from "@/lib/auth/guards";
import { getPrisma } from "@/lib/database/client";
import { formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin logs",
  robots: { index: false },
};

interface LogRow {
  id: string;
  type: string;
  message: string;
  actor: string | null;
  createdAt: string;
}

export default async function AdminLogsPage() {
  await guardAdmin("/admin/logs");

  const logs: LogRow[] = [];
  const prisma = getPrisma();
  if (prisma) {
    try {
      const rows = await prisma.activity.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { user: { select: { username: true } } },
      });
      logs.push(
        ...rows.map((row) => ({
          id: row.id,
          type: row.type,
          message: row.message,
          actor: row.user?.username ?? null,
          createdAt: row.createdAt.toISOString(),
        })),
      );
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="size-4 text-primary" /> Activity log
            </CardTitle>
            <CardDescription>
              Latest {logs.length} events (admin actions, account changes).
            </CardDescription>
          </div>
          <Link
            href="/api/admin/logs?type=admin&limit=50"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            JSON endpoint <ExternalLink className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {!prisma || logs.length === 0 ? (
            <Alert variant="warning">
              <span className="font-medium">No recorded events.</span> The audit
              log is written to the database — configure{" "}
              <code className="font-mono">DATABASE_URL</code> to start capturing
              admin and account activity.
            </Alert>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-surface">
                  <tr className="border-b border-border text-left text-[0.7rem] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatRelativeTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{log.type}</Badge>
                      </td>
                      <td className="px-4 py-3">{log.message}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.actor ? `@${log.actor}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
