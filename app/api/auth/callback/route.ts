import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCode,
  fetchDiscordUser,
  oauthConfigured,
  avatarUrl,
} from "@/lib/auth/discord";
import { createSession, resolveRole } from "@/lib/auth/session";
import { getPrisma } from "@/lib/database/client";
import { adminDiscordIds } from "@/lib/config";
import type { SessionUser } from "@/types";

export const runtime = "nodejs";

/**
 * GET /api/auth/callback — Discord OAuth redirect target.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));

  if (error) return redirectTo("/login?error=oauth_denied");
  if (!oauthConfigured()) return redirectTo("/login?error=oauth_not_configured");
  if (!code || !state) return redirectTo("/login?error=missing_code");

  const expectedState = request.cookies.get("du_oauth_state")?.value;
  if (!expectedState || expectedState !== state) {
    return redirectTo("/login?error=invalid_state");
  }

  const nextPath = request.cookies.get("du_oauth_next")?.value ?? "/dashboard";
  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/dashboard";

  try {
    const token = await exchangeCode(code);
    const discordUser = await fetchDiscordUser(token.access_token);

    const prisma = getPrisma();
    const isAdminByEnv = adminDiscordIds().includes(discordUser.id);

    let user: SessionUser;

    if (prisma) {
      const record = await prisma.user.upsert({
        where: { discordId: discordUser.id },
        update: {
          username: discordUser.username,
          name: discordUser.global_name ?? discordUser.username,
          email: discordUser.email ?? null,
          image: avatarUrl(discordUser.id, discordUser.avatar, 256),
          role: isAdminByEnv ? "ADMIN" : undefined,
        },
        create: {
          discordId: discordUser.id,
          username: discordUser.username,
          name: discordUser.global_name ?? discordUser.username,
          email: discordUser.email ?? null,
          image: avatarUrl(discordUser.id, discordUser.avatar, 256),
          role: isAdminByEnv ? "ADMIN" : "USER",
        },
      });

      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "discord",
            providerAccountId: discordUser.id,
          },
        },
        update: { access_token: token.access_token },
        create: {
          userId: record.id,
          provider: "discord",
          providerAccountId: discordUser.id,
          access_token: token.access_token,
          token_type: token.token_type,
          expires_at: token.expires_in
            ? Math.floor(Date.now() / 1000) + token.expires_in
            : null,
          scope: "identify email guilds",
        },
      });

      await prisma.activity.create({
        data: {
          userId: record.id,
          type: "auth",
          message: "Signed in with Discord",
        },
      });

      user = {
        id: record.id,
        username: record.username,
        name: record.name,
        image: record.image,
        email: record.email,
        discordId: discordUser.id,
        role: resolveRole(discordUser.id, record.role),
        points: record.points,
        isBotVerified: record.isBotVerified,
        createdAt: record.createdAt.toISOString(),
      };
    } else {
      // No database configured — session is still valid and signed, but data
      // is ephemeral. The dashboard explains this state to the user.
      user = {
        id: `local_${discordUser.id}`,
        username: discordUser.username,
        name: discordUser.global_name ?? discordUser.username,
        image: avatarUrl(discordUser.id, discordUser.avatar, 256),
        email: discordUser.email ?? null,
        discordId: discordUser.id,
        role: resolveRole(discordUser.id),
        points: 0,
        isBotVerified: false,
        createdAt: new Date().toISOString(),
      };
    }

    await createSession(user);

    const response = NextResponse.redirect(new URL(safeNext, request.url));
    response.cookies.delete("du_oauth_state");
    response.cookies.delete("du_oauth_next");
    return response;
  } catch (err) {
    console.error("[auth] callback failed:", err);
    return redirectTo("/login?error=oauth_failed");
  }
}
