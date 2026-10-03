import { probeEndpoint } from "@/lib/roblox/api";
import { serverError, cached } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";

export const runtime = "nodejs";

const PROBES = [
  { name: "Users API", url: "https://users.roblox.com/v1/users/1" },
  { name: "Games API", url: "https://games.roblox.com/v1/games?universeIds=1" },
  {
    name: "Thumbnails API",
    url: "https://thumbnails.roblox.com/v1/users/avatar?userIds=1&size=420x420&format=Png",
  },
  { name: "Avatar API", url: "https://avatar.roblox.com/v1/users/1/avatar" },
  { name: "Groups API", url: "https://groups.roblox.com/v1/groups/1200769" },
  {
    name: "Presence API",
    url: "https://presence.roblox.com/v1/presence/users",
  },
  {
    name: "Client Settings",
    url: "https://clientsettings.roblox.com/v1/client-version/WindowsPlayer",
  },
];

/**
 * GET /api/roblox/status
 * Live health probes against Roblox's public endpoints.
 */
export async function GET(request: Request) {
  const limited = guardRateLimit(request, "roblox:status", 20);
  if (limited) return limited;

  try {
    const data = await cached("roblox:status", 60_000, async () => {
      const results = await Promise.all(
        PROBES.map((probe) => probeEndpoint(probe.name, probe.url)),
      );
      const operational = results.filter((r) => r.ok).length;
      const avgLatency =
        results.reduce((sum, r) => sum + r.latencyMs, 0) / (results.length || 1);

      return {
        checkedAt: new Date().toISOString(),
        status:
          operational === results.length
            ? "operational"
            : operational === 0
              ? "outage"
              : "degraded",
        operational,
        total: results.length,
        avgLatency: Math.round(avgLatency),
        services: results,
      };
    });

    return Response.json({ ok: true, data });
  } catch {
    return serverError("Could not reach Roblox right now. Try again shortly.");
  }
}
