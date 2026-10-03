import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { guardAdmin } from "@/lib/auth/guards";
import { isDatabaseConfigured } from "@/lib/config";
import { getPrisma } from "@/lib/database/client";
import {
  serializeCodeSubmission,
  serializeGameSubmission,
  type SubmissionRow,
} from "@/lib/submissions";
import { SubmissionsQueue } from "@/components/admin/submissions-queue";

export const metadata: Metadata = {
  title: "Submissions",
  robots: { index: false },
};

export default async function AdminSubmissionsPage() {
  await guardAdmin("/admin/submissions");

  const prisma = getPrisma();
  let games: SubmissionRow[] = [];
  let codes: SubmissionRow[] = [];
  let failed = false;

  if (prisma) {
    try {
      const [gameRows, codeRows] = await Promise.all([
        prisma.gameSubmission.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.codeSubmission.findMany({ orderBy: { createdAt: "desc" } }),
      ]);
      games = gameRows.map(serializeGameSubmission);
      codes = codeRows.map(serializeCodeSubmission);
    } catch {
      failed = true;
    }
  }

  const pending = [...games, ...codes].filter((row) => row.status === "pending")
    .length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Review queue</h2>
          <p className="text-sm text-muted-foreground">
            Games and codes posted by signed-in members. Publishing writes a
            real row to the catalogue — reject or discard anything that does not
            work.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {pending} waiting for review
        </span>
      </div>

      {failed && (
        <Alert variant="destructive">
          The submission tables could not be read. Check DATABASE_URL and try
          again.
        </Alert>
      )}

      <SubmissionsQueue
        games={games}
        codes={codes}
        readonly={!isDatabaseConfigured()}
        readonlyNote="No database is configured, so submissions cannot be reviewed yet."
      />
    </div>
  );
}
