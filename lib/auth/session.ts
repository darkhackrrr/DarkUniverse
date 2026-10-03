import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { adminDiscordIds } from "@/lib/config";
import type { Role, SessionUser } from "@/types";

export const SESSION_COOKIE = "du_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

interface SessionPayload extends SessionUser {
  iat: number;
  exp: number;
}

function secret(): string {
  const configured = process.env.AUTH_SECRET;
  if (configured && configured.length >= 16) return configured;
  if (process.env.NODE_ENV !== "production") return "darkuniverse-dev-secret";
  // Production without a configured secret: ephemeral (per-instance) secret so
  // sessions still work, but are never shared or predictable.
  const g = globalThis as { __duSecret?: string };
  if (!g.__duSecret) {
    g.__duSecret = randomBytes(48).toString("hex");
     
    console.warn(
      "[auth] AUTH_SECRET is not set — using an ephemeral secret. Sessions will not survive cold starts.",
    );
  }
  return g.__duSecret;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

function encode(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function resolveRole(discordId: string | null, dbRole?: Role): Role {
  if (dbRole === "ADMIN") return "ADMIN";
  if (discordId && adminDiscordIds().includes(discordId)) return "ADMIN";
  return "USER";
}

export async function createSession(user: SessionUser): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const token = encode({ ...user, iat: now, exp: now + SESSION_TTL_SECONDS });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Reads and verifies the session cookie (server only). */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decode(token);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;
  const { iat: _iat, exp: _exp, ...user } = session;
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Server guard: throws AuthError when unauthenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("You must be signed in.", 401);
  return user;
}

/** Server guard: admin permissions are never trusted from the client. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  const isAdmin =
    user.role === "ADMIN" || adminDiscordIds().includes(user.discordId ?? "");
  if (!isAdmin) throw new AuthError("Administrator access required.", 403);
  return { ...user, role: "ADMIN" };
}
