import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { buildAuthorizeUrl, oauthConfigured } from "@/lib/auth/discord";

export const runtime = "nodejs";

/**
 * GET /api/auth/login → redirects to Discord OAuth.
 * When Discord credentials are missing the user is sent back to /login with a
 * clear explanation instead of a dead end.
 */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next") ?? "/dashboard";

  if (!oauthConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_not_configured", request.url),
    );
  }

  const state = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(buildAuthorizeUrl(state));
  response.cookies.set("du_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set("du_oauth_next", next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
  return response;
}
