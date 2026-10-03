import { z } from "zod";
import {
  requireAdminRequest,
  adminDatabase,
  isResponse,
  isMissingRow,
} from "@/lib/api/admin";
import { badRequest, jsonError, jsonOk, notFound } from "@/lib/api/helpers";
import { logActivity } from "@/lib/activity";
import { listGames } from "@/lib/content";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

const gameSchema = z.object({
  id: z.string().optional(),
  slug: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1, "Name is required."),
  description: z.string().trim().min(1, "Description is required."),
  genre: z.string().trim().min(1, "Genre is required."),
  status: z.enum(["Live", "Beta", "Testing", "Development"]),
  players: z.coerce.number().int().min(0).default(0),
  robloxUrl: z.string().trim().url("A Roblox URL is required."),
  thumbUrl: z.string().trim().url().or(z.literal("")).default(""),
  universeId: z.string().trim().or(z.literal("")).default(""),
  featured: z.coerce.boolean().default(false),
});

export async function GET(request: Request) {
  const admin = await requireAdminRequest(request, "admin:games", 60);
  if (isResponse(admin)) return admin;

  const games = await listGames();
  const client = adminDatabase();
  return jsonOk({ games, persistent: !isResponse(client) });
}

export async function POST(request: Request) {
  return upsert(request);
}

export async function PUT(request: Request) {
  return upsert(request);
}

async function upsert(request: Request) {
  const admin = await requireAdminRequest(request, "admin:games:write", 40);
  if (isResponse(admin)) return admin;

  const client = adminDatabase();
  if (isResponse(client)) return client;

  const body = await request.json().catch(() => null);
  const parsed = gameSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid game.");
  }

  const data = parsed.data;
  const slug = (data.slug ?? slugify(data.name)).toLowerCase();
  const payload = {
    slug,
    name: data.name,
    description: data.description,
    genre: data.genre,
    status: data.status,
    players: data.players,
    robloxUrl: data.robloxUrl,
    thumbUrl: data.thumbUrl || null,
    universeId: data.universeId || null,
    featured: data.featured,
  };

  try {
    if (data.id) {
      // Editing a seed record (not yet in the database) creates a database row
      // with the same id so the loader's merge overrides the seed entry.
      try {
        await client.game.update({ where: { id: data.id }, data: payload });
      } catch (err) {
        if (isMissingRow(err)) {
          await client.game.create({ data: { id: data.id, ...payload } });
        } else {
          throw err;
        }
      }
      await logActivity(admin.id, "admin", `Updated game ${data.name}.`, {
        resource: "game",
        id: data.id,
      });
      return jsonOk({ id: data.id, saved: true });
    }

    const created = await client.game.create({ data: payload });
    await logActivity(admin.id, "admin", `Created game ${data.name}.`, {
      resource: "game",
      id: created.id,
    });
    return jsonOk({ id: created.id, saved: true }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return jsonError("A game with that slug already exists.", 409);
    }
    throw err;
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdminRequest(request, "admin:games:write", 40);
  if (isResponse(admin)) return admin;

  const client = adminDatabase();
  if (isResponse(client)) return client;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return badRequest("An id is required.");

  try {
    const existing = await client.game.findUnique({ where: { id } });
    if (!existing) {
      return notFound(
        "That game comes from the built-in seed catalogue and cannot be deleted.",
      );
    }
    await client.game.delete({ where: { id } });
    await logActivity(admin.id, "admin", `Deleted game ${existing.name}.`, {
      resource: "game",
      id,
    });
    return jsonOk({ id, deleted: true });
  } catch {
    return jsonError("Could not delete that game.", 500);
  }
}
