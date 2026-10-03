import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { isOAuthConfigured } from "@/lib/config";
import { readJson } from "@/lib/api/guard";
import { badRequest, jsonError } from "@/lib/api/helpers";
import type { SessionUser } from "@/types";

export const runtime = "nodejs";

/**
 * POST /api/auth/demo
 *
 * Development/demo sign-in used when Discord OAuth credentials are not
 * available yet. Disabled automatically when OAuth is configured, and always
 * disabled in production unless ALLOW_DEMO_LOGIN=true is set explicitly.
 */
export async function POST(request: NextRequest) {
  const demoAllowed =
    process.env.ALLOW_DEMO_LOGIN === "true" || !isOAuthConfigured();

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_LOGIN !== "true") {
    return jsonError("Demo sign-in is disabled in production.", 403);
  }
  if (!demoAllowed) {
    return jsonError("Discord sign-in is configured — use that instead.", 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  let username = "";
  let role = "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    username = String(form.get("username") ?? "");
    role = String(form.get("role") ?? "");
  } else {
    const parsed = await readJson(request);
    if ("error" in parsed) return parsed.error;
    const body = parsed.body as { username?: string; role?: string };
    username = body.username ?? "";
    role = body.role ?? "";
  }

  username = username.trim();
  if (username && !/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return badRequest("Username must be 3–20 characters (letters, numbers, _).");
  }

  const name = username || "DemoUser";
  const wantsAdmin = role === "admin";
  const adminAllowed =
    wantsAdmin && process.env.NODE_ENV !== "production";

  const user: SessionUser = {
    id: `demo_${name.toLowerCase()}`,
    username: name,
    name,
    image: null,
    email: null,
    discordId: null,
    role: adminAllowed ? "ADMIN" : "USER",
    points: 120,
    isBotVerified: false,
    createdAt: new Date().toISOString(),
  };

  await createSession(user);
  return NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });
}
