import { z } from "zod";
import {
  requireAdminRequest,
  adminDatabase,
  isResponse,
  isMissingRow,
} from "@/lib/api/admin";
import { badRequest, jsonError, jsonOk, notFound } from "@/lib/api/helpers";
import { logActivity } from "@/lib/activity";
import { listCodes, listGames } from "@/lib/content";

export const runtime = "nodejs";

const codeSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(3, "Code is required.").max(40),
  reward: z.string().trim().min(1, "Reward is required."),
  status: z.enum(["active", "expired", "upcoming"]),
  expiresAt: z.string().trim().or(z.literal("")).default(""),
  gameId: z.string().trim().or(z.literal("")).default(""),
});

export async function GET(request: Request) {
  const admin = await requireAdminRequest(request, "admin:codes", 60);
  if (isResponse(admin)) return admin;

  const [codes, games] = await Promise.all([listCodes(), listGames()]);
  const client = adminDatabase();
  return jsonOk({
    codes,
    games: games.map((g) => ({ id: g.id, name: g.name, slug: g.slug })),
    persistent: !isResponse(client),
  });
}

export async function POST(request: Request) {
  return upsert(request);
}

export async function PUT(request: Request) {
  return upsert(request);
}

async function upsert(request: Request) {
  const admin = await requireAdminRequest(request, "admin:codes:write", 40);
  if (isResponse(admin)) return admin;

  const client = adminDatabase();
  if (isResponse(client)) return client;

  const body = await request.json().catch(() => null);
  const parsed = codeSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid code.");
  }

  const data = parsed.data;
  const expiresAt =
    data.expiresAt && !Number.isNaN(Date.parse(data.expiresAt))
      ? new Date(data.expiresAt)
      : null;
  const payload = {
    code: data.code.toUpperCase(),
    reward: data.reward,
    status: data.status,
    expiresAt,
    gameId: data.gameId || null,
  };

  try {
    if (data.id) {
      try {
        await client.gameCode.update({ where: { id: data.id }, data: payload });
      } catch (err) {
        if (isMissingRow(err)) {
          await client.gameCode.create({ data: { id: data.id, ...payload } });
        } else {
          throw err;
        }
      }
      await logActivity(admin.id, "admin", `Updated code ${payload.code}.`, {
        resource: "code",
        id: data.id,
      });
      return jsonOk({ id: data.id, saved: true });
    }

    const created = await client.gameCode.create({ data: payload });
    await logActivity(admin.id, "admin", `Created code ${payload.code}.`, {
      resource: "code",
      id: created.id,
    });
    return jsonOk({ id: created.id, saved: true }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return jsonError("That code already exists.", 409);
    }
    throw err;
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdminRequest(request, "admin:codes:write", 40);
  if (isResponse(admin)) return admin;

  const client = adminDatabase();
  if (isResponse(client)) return client;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return badRequest("An id is required.");

  try {
    const existing = await client.gameCode.findUnique({ where: { id } });
    if (!existing) {
      return notFound(
        "That code comes from the built-in seed catalogue and cannot be deleted.",
      );
    }
    await client.gameCode.delete({ where: { id } });
    await logActivity(admin.id, "admin", `Deleted code ${existing.code}.`, {
      resource: "code",
      id,
    });
    return jsonOk({ id, deleted: true });
  } catch {
    return jsonError("Could not delete that code.", 500);
  }
}
