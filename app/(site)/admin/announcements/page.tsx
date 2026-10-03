import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { guardAdmin } from "@/lib/auth/guards";
import { listAnnouncements } from "@/lib/content";
import { isDatabaseConfigured, announcementCategories } from "@/lib/config";
import { AdminResourceTable } from "@/components/admin/admin-resource-table";
import type { FieldSpec } from "@/components/admin/data-table";

export const metadata: Metadata = {
  title: "Manage announcements",
  robots: { index: false },
};

const fields: FieldSpec[] = [
  { name: "title", label: "Title", required: true, placeholder: "New update is live" },
  {
    name: "slug",
    label: "Slug",
    help: "Defaults to a slugified title.",
    placeholder: "new-update-is-live",
  },
  { name: "description", label: "Description", type: "textarea", required: true },
  {
    name: "category",
    label: "Category",
    type: "select",
    required: true,
    options: announcementCategories.map((value) => ({ value, label: value })),
  },
  {
    name: "publishedAt",
    label: "Published at",
    help: "ISO date/time, defaults to now.",
    placeholder: "2026-10-01T12:00:00Z",
  },
  { name: "imageUrl", label: "Image URL", type: "url" },
  {
    name: "link",
    label: "External link",
    type: "url",
    help: "Optional destination for the post.",
  },
];

export default async function AdminAnnouncementsPage() {
  await guardAdmin("/admin/announcements");
  const announcements = await listAnnouncements();

  const rows = announcements.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    description: post.description,
    category: post.category,
    publishedAt: post.publishedAt,
    imageUrl: post.imageUrl ?? "",
    link: post.link ?? "",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
        <CardDescription>
          {announcements.length} posts shown on /updates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdminResourceTable
          resource="announcements"
          title="Announcement"
          createLabel="New announcement"
          rows={rows}
          fields={fields}
          readonly={!isDatabaseConfigured()}
          readonlyNote="No database is configured, so edits are disabled. The table below is the built-in seed data."
        />
      </CardContent>
    </Card>
  );
}
