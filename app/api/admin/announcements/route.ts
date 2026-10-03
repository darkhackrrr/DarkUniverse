import { z } from "zod";
import {
  requireAdminRequest,
  adminDatabase,
  isResponse,
  isMissingRow,
} from "@/lib/api/admin";
import { badRequest, jsonError, jsonOk, notFound } from "@/lib/api/helpers";
import { logActivity } from "@/lib/activity";
import { listAnnouncements } from "@/lib/content";
import { announcementCategories } from "@/lib/config";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

const announcementSchema = z.object({
  id: z.string().optional(),
  slug: z.string().trim().optional(),
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim().min(1, "Description is required."),
  category: z.enum(announcementCategories),
  imageUrl: z.string().trim().url().or(z.literal("")).default(""),
  link: z.string().trim().url().or(z.literal("")).default(""),
  publishedAt: z.string().trim().default(""),
});

export async function GET(request: Request) {
  const admin = await requireAdminRequest(request, "admin:announcements", 60);
  if (isResponse(admin)) return admin;

  const announcements = await listAnnouncements();
  const client = adminDatabase();
  return jsonOk({ announcements, persistent: !isResponse(client) });
}

export async function POST(request: Request) {
  return upsert(request);
}

export async function PUT(request: Request) {
  return upsert(request);
}

async function upsert(request: Request) {
  const admin = await requireAdminRequest(
    request,
    "admin:announcements:write",
    40,
  );
  if (isResponse(admin)) return admin;

  const client = adminDatabase();
  if (isResponse(client)) return client;

  const body = await request.json().catch(() => null);
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid announcement.");
  }

  const data = parsed.data;
  const slug = (data.slug ?? slugify(data.title)).toLowerCase();
  const publishedAt =
    data.publishedAt && !Number.isNaN(Date.parse(data.publishedAt))
      ? new Date(data.publishedAt)
      : new Date();

  const payload = {
    slug,
    title: data.title,
    description: data.description,
    category: data.category,
    imageUrl: data.imageUrl || null,
    link: data.link || null,
    publishedAt,
  };

  try {
    if (data.id) {
      try {
        await client.announcement.update({
          where: { id: data.id },
          data: payload,
        });
      } catch (err) {
        if (isMissingRow(err)) {
          await client.announcement.create({ data: { id: data.id, ...payload } });
        } else {
          throw err;
        }
      }
      await logActivity(
        admin.id,
        "admin",
        `Updated announcement ${data.title}.`,
        { resource: "announcement", id: data.id },
      );
      return jsonOk({ id: data.id, saved: true });
    }

    const created = await client.announcement.create({ data: payload });
    await logActivity(admin.id, "admin", `Created announcement ${data.title}.`, {
      resource: "announcement",
      id: created.id,
    });
    return jsonOk({ id: created.id, saved: true }, { status: 201 });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return jsonError("An announcement with that slug already exists.", 409);
    }
    throw err;
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdminRequest(
    request,
    "admin:announcements:write",
    40,
  );
  if (isResponse(admin)) return admin;

  const client = adminDatabase();
  if (isResponse(client)) return client;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return badRequest("An id is required.");

  try {
    const existing = await client.announcement.findUnique({ where: { id } });
    if (!existing) {
      return notFound(
        "That announcement comes from the built-in seed catalogue and cannot be deleted.",
      );
    }
    await client.announcement.delete({ where: { id } });
    await logActivity(admin.id, "admin", `Deleted announcement ${existing.title}.`, {
      resource: "announcement",
      id,
    });
    return jsonOk({ id, deleted: true });
  } catch {
    return jsonError("Could not delete that announcement.", 500);
  }
}
