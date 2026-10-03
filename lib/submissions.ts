import type { CodeSubmission, GameSubmission } from "@prisma/client";

/**
 * Shared shape for the community submission review queue: the admin API and
 * the /admin/submissions page both serialise rows through here so the client
 * component gets one predictable type.
 */
export interface SubmissionRow {
  id: string;
  status: string;
  name: string;
  detail: string;
  genre: string | null;
  gameName: string | null;
  robloxUrl: string | null;
  expiresAt: string | null;
  note: string | null;
  reviewerNote: string | null;
  submitterName: string;
  createdAt: string;
  reviewedAt: string | null;
}

export function serializeGameSubmission(row: GameSubmission): SubmissionRow {
  return {
    id: row.id,
    status: row.status,
    name: row.name,
    detail: row.description,
    genre: row.genre,
    gameName: null,
    robloxUrl: row.robloxUrl,
    expiresAt: null,
    note: row.note,
    reviewerNote: row.reviewerNote,
    submitterName: row.submitterName,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  };
}

export function serializeCodeSubmission(row: CodeSubmission): SubmissionRow {
  return {
    id: row.id,
    status: row.status,
    name: row.code,
    detail: row.reward,
    genre: null,
    gameName: row.gameName,
    robloxUrl: null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    note: row.note,
    reviewerNote: row.reviewerNote,
    submitterName: row.submitterName,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  };
}
