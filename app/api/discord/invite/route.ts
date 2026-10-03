import { extractInviteCode } from "@/lib/roblox/parse";
import { badRequest, notFound, serverError, cached } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";

export const runtime = "nodejs";

interface DiscordInvite {
  code: string;
  type?: number;
  expires_at?: string | null;
  guild?: {
    id: string;
    name: string;
    icon?: string | null;
    description?: string | null;
    vanity_url_code?: string | null;
    premium_subscription_count?: number;
    approximate_member_count?: number;
    approximate_presence_count?: number;
    features?: string[];
  };
  channel?: { id: string; name?: string; type?: number } | null;
  inviter?: { id: string; username?: string; global_name?: string | null; avatar?: string | null };
}

/**
 * GET /api/discord/invite?code=discord.gg/abc → public invite metadata.
 * Uses Discord's public invite endpoint (no token required for basic info).
 */
export async function GET(request: Request) {
  const limited = guardRateLimit(request, "discord:invite", 30);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const code = extractInviteCode(
    searchParams.get("code") ?? searchParams.get("invite") ?? "",
  );
  if (!code) return badRequest("Provide a valid Discord invite code or URL.");

  try {
    const data = await cached(`discord:invite:${code}`, 120_000, async () => {
      const res = await fetch(
        `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true&with_expiration=true`,
        {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(10_000),
          cache: "no-store",
        },
      );

      if (res.status === 404) {
        throw Object.assign(new Error("Invite not found or expired."), {
          __status: 404,
        });
      }
      if (!res.ok) {
        throw Object.assign(new Error("Discord API is unavailable."), {
          __status: 502,
        });
      }

      const invite = (await res.json()) as DiscordInvite;
      return {
        code: invite.code,
        guild: invite.guild ?? null,
        channel: invite.channel ?? null,
        inviter: invite.inviter
          ? {
              id: invite.inviter.id,
              username: invite.inviter.username,
              displayName: invite.inviter.global_name ?? null,
              avatarUrl: invite.inviter.avatar
                ? `https://cdn.discordapp.com/avatars/${invite.inviter.id}/${invite.inviter.avatar}.png?size=64`
                : null,
            }
          : null,
        expiresAt: invite.expires_at ?? null,
        inviteUrl: `https://discord.gg/${invite.code}`,
      };
    });

    return Response.json({ ok: true, data });
  } catch (err) {
    const status = (err as { __status?: number }).__status;
    if (status === 404) return notFound("That invite is invalid or has expired.");
    if (status === 502) return serverError("Discord is unavailable right now.");
    return serverError();
  }
}
