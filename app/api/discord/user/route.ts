import { badRequest, notFound, serverError, cached } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";

export const runtime = "nodejs";

interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  banner: string | null;
  accent_color: number | null;
  public_flags?: number;
  verified?: boolean;
}

/**
 * GET /api/discord/user?id=<discordUserId>
 *
 * Requires DISCORD_BOT_TOKEN. When no token is configured we return a clear,
 * structured error so the UI can explain the limitation instead of faking data.
 */
export async function GET(request: Request) {
  const limited = guardRateLimit(request, "discord:user", 30);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const id = (searchParams.get("id") ?? "").trim();
  if (!/^\d{17,20}$/.test(id)) {
    return badRequest("Provide a valid Discord user ID (17–20 digits).");
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    return Response.json(
      {
        ok: false,
        error:
          "DISCORD_BOT_TOKEN is not configured. Add it to your environment to look up Discord users.",
        code: "BOT_TOKEN_MISSING",
      },
      { status: 503 },
    );
  }

  try {
    const data = await cached(`discord:user:${id}`, 300_000, async () => {
      const res = await fetch(`https://discord.com/api/v10/users/${id}`, {
        headers: {
          Authorization: `Bot ${token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      });

      if (res.status === 404) {
        throw Object.assign(new Error("User not found."), { __status: 404 });
      }
      if (res.status === 401 || res.status === 403) {
        throw Object.assign(new Error("Bot token was rejected by Discord."), {
          __status: 502,
        });
      }
      if (!res.ok) {
        throw Object.assign(new Error("Discord API is unavailable."), {
          __status: 502,
        });
      }

      const user = (await res.json()) as DiscordUser;
      const cdn = "https://cdn.discordapp.com";
      return {
        id: user.id,
        username: user.username,
        displayName: user.global_name ?? null,
        verified: Boolean(user.verified),
        accentColor: user.accent_color,
        avatarUrls: user.avatar
          ? [16, 32, 64, 128, 256, 512, 1024].map(
              (size) =>
                `${cdn}/avatars/${user.id}/${user.avatar}.png?size=${size}`,
            )
          : [],
        avatarGif: user.avatar?.startsWith("a_")
          ? `${cdn}/avatars/${user.id}/${user.avatar}.gif?size=1024`
          : null,
        defaultAvatar: `${cdn}/embed/avatars/${(BigInt(user.id) >> 22n) % 6n}.png`,
        bannerUrls: user.banner
          ? [64, 128, 256, 512, 1024, 2048].map(
              (size) =>
                `${cdn}/banners/${user.id}/${user.banner}.png?size=${size}`,
            )
          : [],
        bannerColor: user.accent_color
          ? `#${user.accent_color.toString(16).padStart(6, "0").toUpperCase()}`
          : null,
      };
    });

    return Response.json({ ok: true, data });
  } catch (err) {
    const status = (err as { __status?: number }).__status;
    if (status === 404) return notFound("Discord user not found.");
    if (status === 502) return serverError("Discord rejected the request.");
    return serverError();
  }
}
