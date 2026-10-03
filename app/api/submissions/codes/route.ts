import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { guardRateLimit } from "@/lib/api/guard";
import { badRequest, jsonError, jsonOk } from "@/lib/api/helpers";
import { getCurrentUser } from "@/lib/auth/session";
import { getPrisma } from "@/lib/database/client";

export const runtime = "nodejs";

const codeSchema = z.object({
  code: z.string().trim().min(3, "Codes are at least 3 characters.").max(40, "Keep the code under 40 characters."),
  reward: z.string().trim().min(3, "Say what the code gives you.").max(120, "Keep the reward under 120 characters."),
  gameName: z.string().trim().max(80, "Game name is too long.").default(""),
  expiresAt: z.string().trim().max(40).default(""),
  note: z.string().trim().max(300, "Keep the note under 300 characters.").default(""),
});

export async function POST(request: Request) {
  const limited = guardRateLimit(request, "submit:code", 15);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in with Discord to share a code.", 401);

  const prisma = getPrisma();
  if (!prisma) return jsonError("Code submissions require a database.", 503);

  const body = await request.json().catch(() => null);
  const parsed = codeSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Check the form fields.");
  }

  const { code, reward, gameName, expiresAt, note } = parsed.data;

  let expiry: Date | null = null;
  if (expiresAt) {
    const time = Date.parse(expiresAt);
    if (Number.isNaN(time)) return badRequest("Expiry must be a date like 2026-12-31.");
    expiry = new Date(time);
  }

  try {
    const existing = await prisma.gameCode.findFirst({
      where: { code: { equals: code, mode: "insensitive" } },
    });
    if (existing) {
      return jsonError("That code is already listed.", 409);
    }

    let gameId: string | null = null;
    if (gameName) {
      const game = await prisma.game.findFirst({
        where: { name: { equals: gameName, mode: "insensitive" } },
        select: { id: true },
      });
      gameId = game?.id ?? null;
    }

    const created = await prisma.codeSubmission.create({
      data: {
        code,
        reward,
        gameName: gameName || null,
        gameId,
        expiresAt: expiry,
        note: note || null,
        submitterId: user.id,
        submitterName: user.username,
      },
    });

    await logActivity(user.id, "submission", `Shared code ${code}.`, {
      resource: "code",
      id: created.id,
    });

    return jsonOk({ id: created.id, status: "pending" }, { status: 201 });
  } catch {
    return jsonError("Could not save your submission. Try again shortly.", 500);
  }
}
