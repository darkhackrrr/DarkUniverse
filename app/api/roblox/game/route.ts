import {
  getGames,
  getGameThumbnails,
  getGameIcons,
  getUniverseVotes,
  placeToUniverse,
  RobloxApiError,
} from "@/lib/roblox/api";
import { parseRobloxGameInput } from "@/lib/roblox/parse";
import { badRequest, notFound, serverError, cached } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";

export const runtime = "nodejs";

/**
 * GET /api/roblox/game?id=<placeId | universeId | game URL>
 * GET /api/roblox/game?id=...&view=thumbnails
 * GET /api/roblox/game?id=...&view=icon
 */
export async function GET(request: Request) {
  const limited = guardRateLimit(request, "roblox:game", 40);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const input = (searchParams.get("id") ?? searchParams.get("place") ?? "").trim();
  const view = searchParams.get("view") ?? "details";

  if (!input) return badRequest("Provide a place ID, universe ID or game URL.");

  try {
    const data = await cached(
      `roblox:game:${input}:${view}`,
      120_000,
      async () => {
        const { placeId, universeId } = parseRobloxGameInput(input);

        let resolvedUniverse = universeId;
        let resolvedPlace = placeId;

        if (!resolvedUniverse && resolvedPlace) {
          resolvedUniverse = await placeToUniverse(resolvedPlace);
        }
        if (!resolvedUniverse && !resolvedPlace) {
          throw new RobloxApiError(
            "Could not find a place or universe ID in that input.",
            400,
          );
        }
        if (resolvedUniverse && !resolvedPlace) {
          const [detail] = await getGames([resolvedUniverse]);
          resolvedPlace = detail?.rootPlaceId ?? 0;
        }
        if (!resolvedUniverse) {
          throw new RobloxApiError("Universe not found.", 404);
        }

        const [detail] = await getGames([resolvedUniverse]);
        if (!detail) throw new RobloxApiError("Game not found.", 404);

        const votes = await getUniverseVotes([resolvedUniverse]);
        const vote = votes[0];

        const base = {
          game: detail,
          placeId: resolvedPlace,
          universeId: resolvedUniverse,
          votes: vote
            ? {
                up: vote.upVotes,
                down: vote.downVotes,
                ratio:
                  vote.upVotes + vote.downVotes > 0
                    ? Math.round(
                        (vote.upVotes / (vote.upVotes + vote.downVotes)) * 100,
                      )
                    : 0,
              }
            : null,
        };

        if (view === "thumbnails") {
          const thumbs = await getGameThumbnails([resolvedUniverse], 8);
          return {
            ...base,
            thumbnails: (thumbs[0]?.thumbnails ?? [])
              .filter((t) => t.imageUrl)
              .map((t) => t.imageUrl),
          };
        }

        if (view === "icon" && resolvedPlace) {
          const icons = await getGameIcons([resolvedPlace], "512x512");
          return { ...base, iconUrl: icons[0]?.imageUrl ?? null };
        }

        const thumbs = await getGameThumbnails([resolvedUniverse], 1);
        return {
          ...base,
          thumbnailUrl: thumbs[0]?.thumbnails?.[0]?.imageUrl ?? null,
        };
      },
    );

    return Response.json({ ok: true, data });
  } catch (err) {
    if (err instanceof RobloxApiError) {
      if (err.status === 404) return notFound("Game not found.");
      if (err.status === 400) return badRequest(err.message);
      return serverError(err.message);
    }
    return serverError();
  }
}
