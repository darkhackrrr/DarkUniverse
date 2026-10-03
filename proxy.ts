import { NextResponse, type NextRequest } from "next/server";
import { adminDiscordIds } from "@/lib/config";

/**
 * Fast-path redirects for signed-out and non-admin visitors.
 *
 * This is a UX shortcut only — it returns a real 307 before any rendering
 * starts instead of letting the layout flush a shell first. The cookie payload
 * is read WITHOUT verifying the HMAC signature, so nothing here is a security
 * boundary: authorisation is still enforced server-side in the pages
 * (`lib/auth/guards.ts`) and APIs (`lib/auth/session.ts`) with a full
 * signature check on every request.
 */
function peekRole(token: string): { role?: string; discordId?: string } | null {
  const [body] = token.split(".");
  if (!body) return null;
  try {
    const normalized = body.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(body, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("du_session")?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url, 307);
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    const payload = peekRole(token);
    if (payload) {
      const isAdmin =
        payload.role === "ADMIN" ||
        adminDiscordIds().includes(payload.discordId ?? "");
      if (!isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.search = "?error=unavailable";
        return NextResponse.redirect(url, 307);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
