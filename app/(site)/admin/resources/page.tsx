import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { guardAdmin } from "@/lib/auth/guards";
import { listResources } from "@/lib/content";
import { isDatabaseConfigured, resourceCategories } from "@/lib/config";
import { AdminResourceTable } from "@/components/admin/admin-resource-table";
import type { FieldSpec } from "@/components/admin/data-table";

export const metadata: Metadata = {
  title: "Manage resources",
  robots: { index: false },
};

const fields: FieldSpec[] = [
  { name: "name", label: "Name", required: true, placeholder: "Rojo" },
  { name: "description", label: "Description", type: "textarea", required: true },
  {
    name: "category",
    label: "Category",
    type: "select",
    required: true,
    options: resourceCategories.map((value) => ({ value, label: value })),
  },
  { name: "url", label: "URL", type: "url", required: true },
  {
    name: "downloadUrl",
    label: "Download URL",
    type: "url",
    help: "Optional direct download link.",
  },
  {
    name: "tags",
    label: "Tags",
    help: "Comma separated: rojo, sync, cli",
    placeholder: "rojo, sync, cli",
  },
  { name: "featured", label: "Featured", type: "checkbox" },
];

export default async function AdminResourcesPage() {
  await guardAdmin("/admin/resources");
  const resources = await listResources();

  const rows = resources.map((resource) => ({
    id: resource.id,
    name: resource.name,
    description: resource.description,
    category: resource.category,
    url: resource.url,
    downloadUrl: resource.downloadUrl ?? "",
    tags: resource.tags.join(", "),
    featured: resource.featured ?? false,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resources</CardTitle>
        <CardDescription>{resources.length} links in the directory.</CardDescription>
      </CardHeader>
      <CardContent>
        <AdminResourceTable
          resource="resources"
          title="Resource"
          createLabel="New resource"
          rows={rows}
          fields={fields}
          readonly={!isDatabaseConfigured()}
          readonlyNote="No database is configured, so edits are disabled. The table below is the built-in seed data."
        />
      </CardContent>
    </Card>
  );
}
