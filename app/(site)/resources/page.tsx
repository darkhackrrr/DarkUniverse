import type { Metadata } from "next";
import { PageHeader, ContentSection } from "@/components/page-header";
import { ResourcesExplorer } from "@/components/resources-explorer";
import { listResources } from "@/lib/content";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Curated Roblox development, Discord, YouTube and creator resources —” docs, communities and tools we actually use.",
  alternates: { canonical: "/resources" },
};

export default async function ResourcesPage() {
  const resources = await listResources();
  const categories = new Set(resources.map((r) => r.category)).size;

  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="Resources"
        description={`${resources.length} hand-picked links across ${categories} categories. Every entry points to a page worth bookmarking.`}
      />
      <ContentSection>
        <ResourcesExplorer items={resources} />
      </ContentSection>
    </>
  );
}
