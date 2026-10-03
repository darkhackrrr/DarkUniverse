import {
  getUser,
  getUserThumbnails,
  getUsernameHistory,
  RobloxApiError,
} from "@/lib/roblox/api";
import { extractNumericId, isValidUsername } from "@/lib/roblox/parse";
import { resolveUsername } from "@/lib/roblox/api";
import { badRequest, notFound, serverError, cached } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";

export const runtime = "nodejs";

/**
 * GET /api/roblox/user?username=builderman
 * GET /api/roblox/user?id=1
 * GET /api/roblox/user?user=roblox.com/users/1/profile
 */
export async function GET(request: Request) {
  const limited = guardRateLimit(request, "roblox:user", 40);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const raw =
    searchParams.get("username") ??
    searchParams.get("user") ??
    searchParams.get("id") ??
    "";

  const input = raw.trim();
  if (!input) return badRequest("Provide a username, user ID or profile URL.");

  try {
    const user = await cached(
      `roblox:user:${input.toLowerCase()}`,
      120_000,
      async () => {
        const numericId = searchParams.has("id") || /^\d+$/.test(input)
          ? extractNumericId(input)
          : null;

        let userId: number;
        if (numericId) {
          userId = numericId;
        } else {
          if (!isValidUsername(input)) {
            throw new RobloxApiError(
              "Usernames must be 3–20 characters (letters, numbers, underscores).",
              400,
            );
          }
          const match = await resolveUsername(input);
          if (!match) {
            throw new RobloxApiError("User not found.", 404);
          }
          userId = match.id;
        }

        const profile = await getUser(userId);
        const [thumb] = await getUserThumbnails([userId], "avatar", "720x720");
        const [headshot] = await getUserThumbnails(
          [userId],
          "headshot",
          "420x420",
        );

        let history: Array<{ name: string; created: string }> = [];
        let historyNote: string | null = null;
        if (searchParams.get("history") === "1") {
          try {
            history = await getUsernameHistory(userId);
            if (history.length === 0) {
              historyNote = "This account has never changed its username.";
            }
          } catch {
            historyNote =
              "Name history is not public for this account (Roblox returns 403 for some users).";
          }
        }

        return {
          profile,
          avatarUrl: thumb?.imageUrl ?? null,
          headshotUrl: headshot?.imageUrl ?? null,
          history,
          historyNote,
        };
      },
    );

    return Response.json({ ok: true, data: user });
  } catch (err) {
    if (err instanceof RobloxApiError) {
      if (err.status === 404) return notFound("Roblox user not found.");
      if (err.status === 400) return badRequest(err.message);
      return serverError(err.message);
    }
    return serverError();
  }
}
