import { z } from "zod";
import { getPrisma } from "@/lib/database/client";
import { getCurrentUser } from "@/lib/auth/session";
import { badRequest, jsonError, jsonOk, serverError } from "@/lib/api/helpers";
import { guardRateLimit, readJson } from "@/lib/api/guard";

export const runtime = "nodejs";

const PROFILE_COOKIE = "du_bio";

const profileSchema = z.object({
  bio: z.string().trim().max(280, "Bio must be 280 characters or fewer."),
});

async function readLocalBio(): Promise<string> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  return jar.get(PROFILE_COOKIE)?.value ?? "";
}

async function writeLocalBio(bio: string): Promise<void> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  if (!bio) {
    jar.delete(PROFILE_COOKIE);
    return;
  }
  jar.set(PROFILE_COOKIE, bio, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function GET(request: Request) {
  const limited = guardRateLimit(request, "profile:read", 60);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return jsonOk({ signedIn: false, bio: "" });

  const prisma = getPrisma();
  if (prisma) {
    try {
      const row = await prisma.user.findUnique({
        where: { id: user.id },
        select: { bio: true },
      });
      return jsonOk({ signedIn: true, bio: row?.bio ?? "", persistent: true });
    } catch {
      return serverError("Database unavailable.");
    }
  }

  return jsonOk({
    signedIn: true,
    bio: await readLocalBio(),
    persistent: false,
  });
}

export async function PATCH(request: Request) {
  const limited = guardRateLimit(request, "profile:write", 30);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to update your profile.", 401);

  const parsed = await readJson(request);
  if ("error" in parsed) return parsed.error;

  const body = profileSchema.safeParse(parsed.body);
  if (!body.success) {
    return badRequest(body.error.issues[0]?.message ?? "Invalid profile.");
  }

  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { bio: body.data.bio || null },
      });
      return jsonOk({ bio: body.data.bio, persistent: true });
    } catch {
      return serverError("Could not save your profile.");
    }
  }

  await writeLocalBio(body.data.bio);
  return jsonOk({ bio: body.data.bio, persistent: false });
}
