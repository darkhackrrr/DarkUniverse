import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import { PageHeader, ContentSection } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listAnnouncements } from "@/lib/content";
import { formatDate } from "@/lib/utils";

/** Read per request so admin edits appear immediately. */
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Updates",
  description:
    "Changelogs, patch notes and announcements from DarkUniverse Hub and DarkUniverse Studios.",
  alternates: { canonical: "/updates" },
};

export default async function UpdatesPage() {
  const announcements = await listAnnouncements();
  const sorted = [...announcements].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt),
  );

  return (
    <>
      <PageHeader
        eyebrow="Changelog"
        title="Updates"
        description="Game patches, website releases and community news — newest first."
      />
      <ContentSection>
        <div className="space-y-4">
          {sorted.map((post, index) => (
            <Link key={post.slug} href={`/updates/${post.slug}`} className="group block">
              <Card className="transition-colors group-hover:border-primary/40">
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.publishedAt)}
                      </span>
                      {index === 0 && <Badge variant="default">Latest</Badge>}
                    </div>
                    <h2 className="font-semibold leading-snug group-hover:text-foreground">
                      {post.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {post.description}
                    </p>
                  </div>
                  <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary sm:mt-0">
                    Read <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {sorted.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Megaphone className="size-6 text-muted-foreground" />
              <p className="text-sm font-medium">No updates published yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Patch notes and announcements will appear here as soon as they
                are posted.
              </p>
            </CardContent>
          </Card>
        )}
      </ContentSection>
    </>
  );
}
