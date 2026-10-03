import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { guardRateLimit } from "@/lib/api/guard";
import { badRequest, jsonError, jsonOk } from "@/lib/api/helpers";
import { getCurrentUser } from "@/lib/auth/session";
import { gameGenres } from "@/lib/config";
import { getPrisma } from "@/lib/database/client";
import { games as seedGames } from "@/lib/data/games";
import { parseRobloxGameInput } from "@/lib/roblox/parse";

export const runtime = "nodejs";

const gameSchema = z.object({
  name: z.string().trim().min(3, "Give your game a name.").max(60, "Keep the name under 60 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Describe your game in a sentence or two.")
    .max(600, "Keep the description under 600 characters."),
  genre: z.enum(gameGenres),
  robloxUrl: z.string().trim().min(1, "Paste your Roblox game link.").max(300, "That link is too long."),
  note: z.string().trim().max(300, "Keep the note under 300 characters.").default(""),
});

function placeIdOf(url: string): number | null {
  return parseRobloxGameInput(url).placeId;
}

function isRobloxUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "roblox.com" || host.endsWith(".roblox.com");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const limited = guardRateLimit(request, "submit:game", 10);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in with Discord to submit a game.", 401);

  const prisma = getPrisma();
  if (!prisma) return jsonError("Game submissions require a database.", 503);

  const body = await request.json().catch(() => null);
  const parsed = gameSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Check the form fields.");
  }

  const { name, description, genre, robloxUrl, note } = parsed.data;

  if (!isRobloxUrl(robloxUrl)) {
    return badRequest("Use a roblox.com link, like https://www.roblox.com/games/1234567890");
  }
  const placeId = placeIdOf(robloxUrl);
  if (!placeId) {
    return badRequest("That link has no game id in it. Paste the address bar link from your game page.");
  }

  try {
    const [pending, published] = await Promise.all([
      prisma.gameSubmission.findMany({ where: { status: "pending" } }),
      prisma.game.findMany({ select: { robloxUrl: true } }),
    ]);

    const alreadyPending = pending.some((row) => placeIdOf(row.robloxUrl) === placeId);
    if (alreadyPending) {
      return jsonError("You already have a pending submission for that game.", 409);
    }
    const alreadyPublished =
      published.some((row) => placeIdOf(row.robloxUrl) === placeId) ||
      seedGames.some((seed) => placeIdOf(seed.robloxUrl) === placeId);
    if (alreadyPublished) {
      return jsonError("That game is already in the catalogue.", 409);
    }

    const created = await prisma.gameSubmission.create({
      data: {
        name,
        description,
        genre,
        robloxUrl,
        note: note || null,
        submitterId: user.id,
        submitterName: user.username,
      },
    });

    await logActivity(user.id, "submission", `Submitted game ${name}.`, {
      resource: "game",
      id: created.id,
      placeId,
    });

    return jsonOk({ id: created.id, status: "pending" }, { status: 201 });
  } catch {
    return jsonError("Could not save your submission. Try again shortly.", 500);
  }
}
