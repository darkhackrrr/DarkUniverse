import {
  getGameThumbnails,
  getGameIcons,
  getGroupIcons,
  getAssetThumbnails,
  placeToUniverse,
  RobloxApiError,
} from "@/lib/roblox/api";
import { extractNumericId, parseRobloxGameInput } from "@/lib/roblox/parse";
import { badRequest, notFound, serverError, cached } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";

export const runtime = "nodejs";

/**
 * GET /api/roblox/media?type=game-thumbnails&id=<placeId|universeId>
 * GET /api/roblox/media?type=game-icon&id=<placeId>
 * GET /api/roblox/media?type=group-icon&id=<groupId>
 * GET /api/roblox/media?type=asset&id=<assetId>
 */
export async function GET(request: Request) {
  const limited = guardRateLimit(request, "roblox:media", 40);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "";
  const rawId = (searchParams.get("id") ?? "").trim();

  if (!rawId) return badRequest("Provide an id.");
  if (!type) return badRequest("Provide a type.");

  try {
    const data = await cached(`roblox:media:${type}:${rawId}`, 300_000, async () => {
      if (type === "game-thumbnails") {
        const { placeId, universeId } = parseRobloxGameInput(rawId);
        let universe = universeId;
        if (!universe && placeId) universe = await placeToUniverse(placeId);
        if (!universe) throw new RobloxApiError("Could not resolve that game.", 400);

        const thumbs = await getGameThumbnails([universe], 8);
        const urls = (thumbs[0]?.thumbnails ?? [])
          .map((t) => t.imageUrl)
          .filter((u): u is string => Boolean(u));
        if (urls.length === 0) throw new RobloxApiError("No thumbnails found.", 404);
        return { urls };
      }

      if (type === "game-icon") {
        const placeId = extractNumericId(rawId);
        if (!placeId) throw new RobloxApiError("Invalid place ID.", 400);
        const icons = await getGameIcons([placeId], "512x512");
        const url = icons[0]?.imageUrl ?? null;
        if (!url) throw new RobloxApiError("No icon found.", 404);
        return { urls: [url] };
      }

      if (type === "group-icon") {
        const groupId = extractNumericId(rawId);
        if (!groupId) throw new RobloxApiError("Invalid group ID.", 400);
        const icons = await getGroupIcons([groupId], "420x420");
        const url = icons[0]?.imageUrl ?? null;
        if (!url) throw new RobloxApiError("No group icon found.", 404);
        return { urls: [url] };
      }

      if (type === "asset") {
        const assetId = extractNumericId(rawId);
        if (!assetId) throw new RobloxApiError("Invalid asset ID.", 400);
        const thumbs = await getAssetThumbnails([assetId], "420x420");
        const url = thumbs[0]?.imageUrl ?? null;
        if (!url) throw new RobloxApiError("No asset image found.", 404);
        return { urls: [url] };
      }

      throw new RobloxApiError("Unknown media type.", 400);
    });

    return Response.json({ ok: true, data });
  } catch (err) {
    if (err instanceof RobloxApiError) {
      if (err.status === 404) return notFound(err.message);
      if (err.status === 400) return badRequest(err.message);
      return serverError(err.message);
    }
    return serverError();
  }
}
