import { z } from "zod";
import {
  requireAdminRequest,
  adminDatabase,
  isResponse,
  isMissingRow,
} from "@/lib/api/admin";
import { badRequest, jsonError, jsonOk, notFound } from "@/lib/api/helpers";
import { logActivity } from "@/lib/activity";
import { listResources } from "@/lib/content";
import { resourceCategories } from "@/lib/config";

export const runtime = "nodejs";

const resourceSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required."),
  description: z.string().trim().min(1, "Description is required."),
  category: z.enum(resourceCategories),
  url: z.string().trim().url("A valid URL is required."),
  downloadUrl: z.string().trim().url().or(z.literal("")).default(""),
  tags: z.string().default(""),
  featured: z.coerce.boolean().default(false),
});

export async function GET(request: Request) {
  const admin = await requireAdminRequest(request, "admin:resources", 60);
  if (isResponse(admin)) return admin;

  const resources = await listResources();
  const client = adminDatabase();
  return jsonOk({ resources, persistent: !isResponse(client) });
}

export async function POST(request: Request) {
  return upsert(request);
}

export async function PUT(request: Request) {
  return upsert(request);
}

async function upsert(request: Request) {
  const admin = await requireAdminRequest(request, "admin:resources:write", 40);
  if (isResponse(admin)) return admin;

  const client = adminDatabase();
  if (isResponse(client)) return client;

  const body = await request.json().catch(() => null);
  const parsed = resourceSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid resource.");
  }

  const data = parsed.data;
  const payload = {
    name: data.name,
    description: data.description,
    category: data.category,
    url: data.url,
    downloadUrl: data.downloadUrl || null,
    tags: data.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    featured: data.featured,
  };

  try {
    if (data.id) {
      try {
        await client.resource.update({ where: { id: data.id }, data: payload });
      } catch (err) {
        if (isMissingRow(err)) {
          await client.resource.create({ data: { id: data.id, ...payload } });
        } else {
          throw err;
        }
      }
      await logActivity(admin.id, "admin", `Updated resource ${data.name}.`, {
        resource: "resource",
        id: data.id,
      });
      return jsonOk({ id: data.id, saved: true });
    }

    const created = await client.resource.create({ data: payload });
    await logActivity(admin.id, "admin", `Created resource ${data.name}.`, {
      resource: "resource",
      id: created.id,
    });
    return jsonOk({ id: created.id, saved: true }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return jsonError("A resource with that id already exists.", 409);
    }
    throw err;
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdminRequest(request, "admin:resources:write", 40);
  if (isResponse(admin)) return admin;

  const client = adminDatabase();
  if (isResponse(client)) return client;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return badRequest("An id is required.");

  try {
    const existing = await client.resource.findUnique({ where: { id } });
    if (!existing) {
      return notFound(
        "That resource comes from the built-in seed catalogue and cannot be deleted.",
      );
    }
    await client.resource.delete({ where: { id } });
    await logActivity(admin.id, "admin", `Deleted resource ${existing.name}.`, {
      resource: "resource",
      id,
    });
    return jsonOk({ id, deleted: true });
  } catch {
    return jsonError("Could not delete that resource.", 500);
  }
}
