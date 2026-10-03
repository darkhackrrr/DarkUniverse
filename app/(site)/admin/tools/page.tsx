import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { guardAdmin } from "@/lib/auth/guards";
import { tools, categories } from "@/lib/tools/registry";
import { AdminResourceTable } from "@/components/admin/admin-resource-table";
import type { FieldSpec } from "@/components/admin/data-table";

export const metadata: Metadata = {
  title: "Tools registry",
  robots: { index: false },
};

const noFields: FieldSpec[] = [];

export default async function AdminToolsPage() {
  await guardAdmin("/admin/tools");

  const rows = tools.map((tool) => ({
    id: tool.slug,
    name: tool.name,
    slug: tool.slug,
    category: tool.category,
    href: tool.href,
    featured: Boolean(tool.featured),
    description: tool.description,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tools registry</CardTitle>
        <CardDescription>
          Tools live in code — <code className="font-mono">lib/tools/registry.ts</code>{" "}
          plus the component map in <code className="font-mono">components/tools/registry.tsx</code>.
          {tools.length} tools across {categories.length} categories.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdminResourceTable
          resource="tools"
          title="Tool"
          createLabel="New tool"
          rows={rows}
          fields={noFields}
          readonly
          readonlyNote="Adding a tool requires a code change: register it in lib/tools/registry.ts, implement it under components/tools/, then add a dynamic import entry in components/tools/registry.tsx. This page only shows what is deployed."
        />
      </CardContent>
    </Card>
  );
}
