import type { Metadata } from "next";
import { PageHeader, ContentSection } from "@/components/page-header";
import { CodesExplorer } from "@/components/codes-explorer";
import { SubmitCodeForm } from "@/components/submit-code-form";
import { listCodes, listGames } from "@/lib/content";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Game Codes",
  description:
    "Active, expired and upcoming codes for DarkUniverse Studios Roblox games — with expiry dates and copy buttons.",
  alternates: { canonical: "/codes" },
};

export default async function CodesPage() {
  const [gameCodes, games] = await Promise.all([listCodes(), listGames()]);
  const active = gameCodes.filter((c) => c.status === "active").length;

  return (
    <>
      <PageHeader
        eyebrow="Rewards"
        title="Game codes"
        description={
          gameCodes.length === 0
            ? "No codes are published yet. When Troll Tower: Impossible Obby drops one, it will land here first."
            : "Every code we've published, verified against the latest patch. Copy a code and redeem it in-game."
        }
      >
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success">
            {active} active
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            {gameCodes.length} total
          </span>
        </div>
      </PageHeader>

      <ContentSection className="space-y-6">
        <CodesExplorer codes={gameCodes} gameList={games} />
        <SubmitCodeForm games={games} />
      </ContentSection>
    </>
  );
}
