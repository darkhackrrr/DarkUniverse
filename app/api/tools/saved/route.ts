import { getPrisma } from "@/lib/database/client";
import { getCurrentUser } from "@/lib/auth/session";
import { getTool } from "@/lib/tools/registry";
import {
  badRequest,
  jsonOk,
  notFound,
  serverError,
} from "@/lib/api/helpers";
import { guardRateLimit, readJson } from "@/lib/api/guard";

export const runtime = "nodejs";

/**
 * Saved tools (favourites) — requires a signed-in session.
 *
 * Without a database configured we fall back to a signed-cookie mirror so the
 * feature still behaves correctly during local development.
 */

const COOKIE = "du_saved_tools";

async function readLocalSaved(): Promise<string[]> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

async function writeLocalSaved(slugs: string[]): Promise<void> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.set(COOKIE, JSON.stringify(slugs.slice(0, 50)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function GET(request: Request) {
  const limited = guardRateLimit(request, "saved:list", 60);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return jsonOk({ saved: [], signedIn: false });

  const prisma = getPrisma();
  if (prisma) {
    try {
      const rows = await prisma.savedTool.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      return jsonOk({
        saved: rows.map((r) => ({
          slug: r.toolSlug,
          note: r.note,
          savedAt: r.createdAt.toISOString(),
        })),
        signedIn: true,
        persistent: true,
      });
    } catch {
      return serverError("Database unavailable.");
    }
  }

  const saved = await readLocalSaved();
  return jsonOk({
    saved: saved.map((slug) => ({ slug, note: null, savedAt: null })),
    signedIn: true,
    persistent: false,
  });
}

export async function POST(request: Request) {
  const limited = guardRateLimit(request, "saved:write", 40);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return jsonError401();

  const parsed = await readJson(request);
  if ("error" in parsed) return parsed.error;
  const body = parsed.body as { slug?: string };
  const slug = body.slug?.trim();
  if (!slug) return badRequest("A tool slug is required.");
  if (!getTool(slug)) return notFound("Unknown tool.");

  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.savedTool.upsert({
        where: { userId_toolSlug: { userId: user.id, toolSlug: slug } },
        update: {},
        create: { userId: user.id, toolSlug: slug },
      });
      return jsonOk({ slug, saved: true });
    } catch {
      return serverError("Could not save this tool.");
    }
  }

  const current = await readLocalSaved();
  if (!current.includes(slug)) {
    await writeLocalSaved([...current, slug]);
  }
  return jsonOk({ slug, saved: true });
}

export async function DELETE(request: Request) {
  const limited = guardRateLimit(request, "saved:write", 40);
  if (limited) return limited;

  const user = await getCurrentUser();
  if (!user) return jsonError401();

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();
  if (!slug) return badRequest("A tool slug is required.");

  const prisma = getPrisma();
  if (prisma) {
    try {
      await prisma.savedTool.deleteMany({
        where: { userId: user.id, toolSlug: slug },
      });
      return jsonOk({ slug, saved: false });
    } catch {
      return serverError("Could not remove this tool.");
    }
  }

  const current = await readLocalSaved();
  await writeLocalSaved(current.filter((s) => s !== slug));
  return jsonOk({ slug, saved: false });
}

function jsonError401() {
  return Response.json(
    { ok: false, error: "Sign in to save tools." },
    { status: 401 },
  );
}
