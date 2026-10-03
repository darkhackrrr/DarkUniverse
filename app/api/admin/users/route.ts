import { z } from "zod";
import {
  requireAdminRequest,
  adminDatabase,
  isResponse,
} from "@/lib/api/admin";
import { badRequest, jsonError, jsonOk, notFound } from "@/lib/api/helpers";
import { logActivity } from "@/lib/activity";
import { getPrisma } from "@/lib/database/client";
import { adminDiscordIds } from "@/lib/config";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireAdminRequest(request, "admin:users", 60);
  if (isResponse(admin)) return admin;

  const prisma = getPrisma();
  if (!prisma) {
    return jsonOk({
      users: [
        {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          email: admin.email,
          discordId: admin.discordId,
          role: admin.role,
          points: admin.points,
          isBotVerified: admin.isBotVerified,
          createdAt: admin.createdAt,
          savedTools: 0,
        },
      ],
      persistent: false,
      note: "Demo mode shows only the signed-in session account.",
    });
  }

  try {
    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { savedTools: true, badges: true } } },
    });
    return jsonOk({
      users: rows.map((row) => ({
        id: row.id,
        username: row.username,
        name: row.name,
        email: row.email,
        discordId: row.discordId,
        role: row.role,
        points: row.points,
        isBotVerified: row.isBotVerified,
        createdAt: row.createdAt.toISOString(),
        savedTools: row._count.savedTools,
        badges: row._count.badges,
      })),
      persistent: true,
      adminDiscordIds: adminDiscordIds(),
    });
  } catch {
    return jsonError("Database unavailable.", 500);
  }
}

const roleSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
});

export async function PATCH(request: Request) {
  const admin = await requireAdminRequest(request, "admin:users:write", 30);
  if (isResponse(admin)) return admin;

  const client = adminDatabase();
  if (isResponse(client)) return client;

  const body = await request.json().catch(() => null);
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) return badRequest("A user id and role are required.");

  if (parsed.data.id === admin.id && parsed.data.role === "USER") {
    return jsonError("You cannot remove your own admin role.", 400);
  }

  try {
    const existing = await client.user.findUnique({ where: { id: parsed.data.id } });
    if (!existing) return notFound("User not found.");

    await client.user.update({
      where: { id: parsed.data.id },
      data: { role: parsed.data.role },
    });
    await logActivity(
      admin.id,
      "admin",
      `Set @${existing.username} role to ${parsed.data.role}.`,
      { resource: "user", id: parsed.data.id },
    );
    return jsonOk({ id: parsed.data.id, role: parsed.data.role });
  } catch {
    return jsonError("Could not update that user.", 500);
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdminRequest(request, "admin:users:write", 30);
  if (isResponse(admin)) return admin;

  const client = adminDatabase();
  if (isResponse(client)) return client;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return badRequest("An id is required.");
  if (id === admin.id) return jsonError("You cannot delete your own account here.", 400);

  try {
    const existing = await client.user.findUnique({ where: { id } });
    if (!existing) return notFound("User not found.");

    await client.user.delete({ where: { id } });
    await logActivity(admin.id, "admin", `Deleted user @${existing.username}.`, {
      resource: "user",
      id,
    });
    return jsonOk({ id, deleted: true });
  } catch {
    return jsonError("Could not delete that user.", 500);
  }
}
