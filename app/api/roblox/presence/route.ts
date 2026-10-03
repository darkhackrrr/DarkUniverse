import {
  getPresence,
  resolveUsername,
  RobloxApiError,
} from "@/lib/roblox/api";
import { extractNumericId, isValidUsername } from "@/lib/roblox/parse";
import { badRequest, notFound, serverError, cached } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";

export const runtime = "nodejs";

const PRESENCE_LABELS = [
  "Offline",
  "Online (website)",
  "In game",
  "Playing (studio)",
  "In a game",
  "Online",
] as const;

/** GET /api/roblox/presence?id=1 | ?username=Roblox */
export async function GET(request: Request) {
  const limited = guardRateLimit(request, "roblox:presence", 40);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const input = (searchParams.get("id") ?? searchParams.get("username") ?? "").trim();
  if (!input) return badRequest("Provide a user ID or username.");

  try {
    const data = await cached(
      `roblox:presence:${input.toLowerCase()}`,
      30_000,
      async () => {
        let userId: number;
        const numericId = extractNumericId(input);
        if (numericId) {
          userId = numericId;
        } else {
          if (!isValidUsername(input)) throw new RobloxApiError("Invalid username.", 400);
          const match = await resolveUsername(input);
          if (!match) throw new RobloxApiError("User not found.", 404);
          userId = match.id;
        }

        const [presence] = await getPresence([userId]);
        if (!presence) throw new RobloxApiError("User not found.", 404);

        return {
          userId,
          presenceType: presence.userPresenceType,
          label:
            PRESENCE_LABELS[presence.userPresenceType] ?? "Unknown",
          lastLocation: presence.lastLocation,
          placeId: presence.placeId,
          rootPlaceId: presence.rootPlaceId,
          universeId: presence.universeId,
          gameId: presence.gameId,
          lastOnline: presence.lastOnline ?? null,
        };
      },
    );

    return Response.json({ ok: true, data });
  } catch (err) {
    if (err instanceof RobloxApiError) {
      if (err.status === 404) return notFound("Roblox user not found.");
      if (err.status === 400) return badRequest(err.message);
      return serverError(err.message);
    }
    return serverError();
  }
}
