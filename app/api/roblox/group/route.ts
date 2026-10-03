import {
  getGroup,
  getGroupIcons,
  RobloxApiError,
} from "@/lib/roblox/api";
import { extractNumericId } from "@/lib/roblox/parse";
import { badRequest, notFound, serverError, cached } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";

export const runtime = "nodejs";

/** GET /api/roblox/group?id=1200769 (accepts group URLs too) */
export async function GET(request: Request) {
  const limited = guardRateLimit(request, "roblox:group", 40);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const input = (searchParams.get("id") ?? searchParams.get("group") ?? "").trim();
  if (!input) return badRequest("Provide a group ID or group URL.");

  const groupId = extractNumericId(input);
  if (!groupId) return badRequest("Could not find a numeric group ID in that input.");

  try {
    const data = await cached(`roblox:group:${groupId}`, 300_000, async () => {
      const group = await getGroup(groupId);
      const [icon] = await getGroupIcons([groupId], "150x150").catch(() => []);
      return { group, iconUrl: icon?.imageUrl ?? null };
    });

    return Response.json({ ok: true, data });
  } catch (err) {
    if (err instanceof RobloxApiError) {
      if (err.status === 404) return notFound("Roblox group not found.");
      if (err.status === 400) return badRequest(err.message);
      return serverError(err.message);
    }
    return serverError();
  }
}
