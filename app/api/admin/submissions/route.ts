import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { adminDatabase, isResponse, requireAdminRequest } from "@/lib/api/admin";
import { badRequest, jsonError, jsonOk, notFound } from "@/lib/api/helpers";
import { getPrisma } from "@/lib/database/client";
import { placeToUniverse } from "@/lib/roblox/api";
import { parseRobloxGameInput } from "@/lib/roblox/parse";
import {
  serializeCodeSubmission,
  serializeGameSubmission,
} from "@/lib/submissions";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

const decisionSchema = z.object({
  type: z.enum(["game", "code"]),
  id: z.string().trim().min(1),
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(300).optional().default(""),
});

export async function GET(request: Request) {
  const admin = await requireAdminRequest(request, "admin:submissions", 60);
  if (isResponse(admin)) return admin;

  const prisma = getPrisma();
  if (!prisma) return jsonError("Submissions require a database.", 503);

  try {
    const [games, codes] = await Promise.all([
      prisma.gameSubmission.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.codeSubmission.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
    return jsonOk({
      games: games.map(serializeGameSubmission),
      codes: codes.map(serializeCodeSubmission),
    });
  } catch {
    return jsonError("Could not load submissions.", 500);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdminRequest(request, "admin:submissions:write", 40);
  if (isResponse(admin)) return admin;

  const client = adminDatabase();
  if (isResponse(client)) return client;

  const body = await request.json().catch(() => null);
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid submission request.");
  }

  const { type, id, action, note } = parsed.data;
  const reviewerNote = note || null;
  const reviewedAt = new Date();

  try {
    if (type === "game") {
      const submission = await client.gameSubmission.findUnique({ where: { id } });
      if (!submission) return notFound("Submission not found.");
      if (submission.status !== "pending") {
        return jsonError("That submission was already reviewed.", 409);
      }

      if (action === "reject") {
        const updated = await client.gameSubmission.update({
          where: { id },
          data: { status: "rejected", reviewerNote, reviewedAt },
        });
        await logActivity(
          admin.id,
          "admin",
          `Rejected game submission ${submission.name}.`,
          { resource: "gameSubmission", id },
        );
        return jsonOk({ id, status: updated.status });
      }

      const slug = await uniqueGameSlug(client, slugify(submission.name));
      const placeId = parseRobloxGameInput(submission.robloxUrl).placeId;
      let universeId: string | null = null;
      if (placeId) {
        try {
          const universe = await placeToUniverse(placeId);
          universeId = universe ? String(universe) : null;
        } catch {
          universeId = null;
        }
      }

      const game = await client.game.create({
        data: {
          slug,
          name: submission.name,
          description: submission.description,
          genre: submission.genre,
          status: "Live",
          players: 0,
          robloxUrl: submission.robloxUrl,
          universeId,
        },
      });
      await client.gameSubmission.update({
        where: { id },
        data: { status: "approved", reviewerNote, reviewedAt, gameId: game.id },
      });
      await logActivity(
        admin.id,
        "admin",
        `Published game ${game.name} from a community submission.`,
        { resource: "game", id: game.id, submissionId: id },
      );
      return jsonOk({ id, status: "approved", gameId: game.id, slug: game.slug });
    }

    const submission = await client.codeSubmission.findUnique({ where: { id } });
    if (!submission) return notFound("Submission not found.");
    if (submission.status !== "pending") {
      return jsonError("That submission was already reviewed.", 409);
    }

    if (action === "reject") {
      const updated = await client.codeSubmission.update({
        where: { id },
        data: { status: "rejected", reviewerNote, reviewedAt },
      });
      await logActivity(
        admin.id,
        "admin",
        `Rejected code submission ${submission.code}.`,
        { resource: "codeSubmission", id },
      );
      return jsonOk({ id, status: updated.status });
    }

    let gameId = submission.gameId;
    if (!gameId && submission.gameName) {
      const game = await client.game.findFirst({
        where: { name: { equals: submission.gameName, mode: "insensitive" } },
        select: { id: true },
      });
      gameId = game?.id ?? null;
    }

    const duplicate = await client.gameCode.findFirst({
      where: { code: { equals: submission.code, mode: "insensitive" } },
      select: { id: true },
    });
    if (duplicate) {
      return jsonError("That code is already published — delete it first if needed.", 409);
    }

    const code = await client.gameCode.create({
      data: {
        code: submission.code,
        reward: submission.reward,
        status: "active",
        expiresAt: submission.expiresAt,
        gameId,
      },
    });
    await client.codeSubmission.update({
      where: { id },
      data: { status: "approved", reviewerNote, reviewedAt, codeId: code.id, gameId },
    });
    await logActivity(
      admin.id,
      "admin",
      `Published code ${code.code} from a community submission.`,
      { resource: "code", id: code.id, submissionId: id },
    );
    return jsonOk({ id, status: "approved", codeId: code.id });
  } catch {
    return jsonError("Could not review that submission.", 500);
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdminRequest(request, "admin:submissions:write", 40);
  if (isResponse(admin)) return admin;

  const client = adminDatabase();
  if (isResponse(client)) return client;

  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const type = params.get("type");
  if (!id || (type !== "game" && type !== "code")) {
    return badRequest("An id and type are required.");
  }

  try {
    if (type === "game") {
      await client.gameSubmission.delete({ where: { id } });
    } else {
      await client.codeSubmission.delete({ where: { id } });
    }
    await logActivity(admin.id, "admin", "Deleted a submission record.", {
      resource: `${type}Submission`,
      id,
    });
    return jsonOk({ id, deleted: true });
  } catch {
    return jsonError("Could not delete that submission.", 500);
  }
}

async function uniqueGameSlug(
  client: PrismaClient,
  base: string,
): Promise<string> {
  const root = base || "game";
  let candidate = root;
  for (let i = 2; i < 50; i++) {
    const clash = await client.game.findUnique({ where: { slug: candidate } });
    if (!clash) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}
