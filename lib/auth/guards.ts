import { redirect } from "next/navigation";
import { getCurrentUser, resolveRole } from "@/lib/auth/session";
import { adminDiscordIds } from "@/lib/config";
import type { SessionUser } from "@/types";

/**
 * Page-level guards. Unlike the throwing API guards (`requireUser` /
 * `requireAdmin`) these redirect to the login page so pages can never render
 * an unauthenticated state by accident.
 */
export async function guardUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function guardAdmin(next = "/admin"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  const isAdmin =
    user.role === "ADMIN" || adminDiscordIds().includes(user.discordId ?? "");
  if (!isAdmin) redirect("/login?error=unavailable");

  return { ...user, role: resolveRole(user.discordId, "ADMIN") };
}
