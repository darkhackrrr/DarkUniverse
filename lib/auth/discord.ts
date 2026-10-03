/**
 * Discord OAuth helpers (server only). No tokens are ever exposed to the
 * client — the exchange happens entirely inside route handlers.
 */

const DISCORD_API = "https://discord.com/api/v10";

export function oauthConfigured(): boolean {
  return Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
}

export function redirectUri(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const origin = base ?? "http://localhost:3000";
  return `${origin}/api/auth/callback`;
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID ?? "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "identify email guilds",
    state,
    prompt: "consent",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export interface DiscordUser {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
  email: string | null;
  verified?: boolean;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  token_type: string;
  expires_in?: number;
}> {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID ?? "",
    client_secret: process.env.DISCORD_CLIENT_SECRET ?? "",
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Discord token exchange failed (${res.status}).`);
  }
  return (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in?: number;
  };
}

export async function fetchDiscordUser(
  accessToken: string,
): Promise<DiscordUser> {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Discord user fetch failed (${res.status}).`);
  return (await res.json()) as DiscordUser;
}

export function avatarUrl(
  userId: string,
  avatar: string | null,
  size = 128,
): string | null {
  if (!avatar) return null;
  const ext = avatar.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${ext}?size=${size}`;
}
