import type { Metadata } from "next";
import { PageHeader, ContentSection } from "@/components/page-header";
import { ToolsExplorer } from "@/components/tools/tools-explorer";
import { tools } from "@/lib/tools/registry";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "All 40 DarkUniverse Hub tools — Roblox lookups, Discord builders, image processors, generators and text utilities.",
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Toolkit"
        title="Tools"
        description={`${tools.length} working tools across Roblox, Discord, YouTube, images and utilities. Image tools run entirely in your browser — nothing is uploaded.`}
      />
      <ContentSection>
        <ToolsExplorer />
      </ContentSection>
    </>
  );
}
