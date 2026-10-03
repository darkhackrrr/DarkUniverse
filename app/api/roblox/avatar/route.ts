import {
  getUserAvatarAssets,
  getOutfits,
  getUserThumbnails,
  resolveUsername,
  RobloxApiError,
} from "@/lib/roblox/api";
import { extractNumericId, isValidUsername } from "@/lib/roblox/parse";
import { badRequest, notFound, serverError, cached } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";

export const runtime = "nodejs";

/**
 * GET /api/roblox/avatar?id=1           → equipped assets + renders
 * GET /api/roblox/avatar?username=x     → same, resolved by username
 * GET /api/roblox/avatar?username=x&outfits=1 → saved outfits
 */
export async function GET(request: Request) {
  const limited = guardRateLimit(request, "roblox:avatar", 40);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const input = (searchParams.get("id") ?? searchParams.get("username") ?? "").trim();
  const wantOutfits = searchParams.get("outfits") === "1";

  if (!input) return badRequest("Provide a user ID or username.");

  try {
    const data = await cached(
      `roblox:avatar:${input.toLowerCase()}:${wantOutfits ? "o" : "a"}`,
      120_000,
      async () => {
        let userId: number;
        const numericId = extractNumericId(input);
        if (numericId) {
          userId = numericId;
        } else {
          if (!isValidUsername(input)) {
            throw new RobloxApiError("Invalid username.", 400);
          }
          const match = await resolveUsername(input);
          if (!match) throw new RobloxApiError("User not found.", 404);
          userId = match.id;
        }

        const [render] = await getUserThumbnails([userId], "avatar", "720x720");
        const [headshot] = await getUserThumbnails([userId], "headshot", "420x420");

        if (wantOutfits) {
          const outfits = await getOutfits(userId);
          const outfitIds = outfits.data.map((o) => o.id);
          const outfitThumbs =
            outfitIds.length > 0
              ? await getUserThumbnails(outfitIds, "avatar", "420x420").catch(
                  () => [],
                )
              : [];
          return {
            userId,
            avatarUrl: render?.imageUrl ?? null,
            headshotUrl: headshot?.imageUrl ?? null,
            outfits: outfits.data.map((o, i) => ({
              id: o.id,
              name: o.name,
              edited: o.edited,
              thumbnail: outfitThumbs[i]?.imageUrl ?? null,
            })),
          };
        }

        const assets = await getUserAvatarAssets(userId);
        return {
          userId,
          avatarUrl: render?.imageUrl ?? null,
          headshotUrl: headshot?.imageUrl ?? null,
          assets,
          outfits: [],
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
