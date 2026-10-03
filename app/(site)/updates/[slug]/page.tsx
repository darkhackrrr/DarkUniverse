import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAnnouncementBySlug, listAnnouncements } from "@/lib/content";
import { formatDate } from "@/lib/utils";

/** Announcements can be edited from /admin, so post pages render per request. */
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const announcements = await listAnnouncements();
  return announcements.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getAnnouncementBySlug(slug);
  if (!post) return { title: "Update not found" };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/updates/${post.slug}` },
    openGraph: { title: post.title, description: post.description, type: "article" },
  };
}

export default async function UpdatePage({ params }: Props) {
  const { slug } = await params;
  const announcements = await listAnnouncements();
  const post = await getAnnouncementBySlug(slug);
  if (!post) notFound();

  const related = announcements
    .filter((a) => a.slug !== post.slug)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/updates" className="inline-flex items-center gap-1.5 hover:text-foreground">
          <ArrowLeft className="size-4" /> Updates
        </Link>
        <span>/</span>
        <span className="text-foreground">{post.category}</span>
      </nav>

      <article>
        <header className="mb-8 border-b border-border pb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{post.category}</Badge>
            <time dateTime={post.publishedAt} className="text-sm text-muted-foreground">
              {formatDate(post.publishedAt, { dateStyle: "long" })}
            </time>
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            {post.description}
          </p>
        </header>

        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            This announcement is part of the DarkUniverse Hub changelog. Full
            technical notes live with the release, and the community discusses
            them in the Discord server.
          </p>
          <p>
            If something in here affects a tool on this site, the tool&apos;s own
            page will have been updated at the same time — refresh if you see
            stale behaviour.
          </p>
        </div>

        {post.link && (
          <div className="mt-8">
            <Button asChild>
              <a
                href={post.link}
                target={post.link.startsWith("/") ? undefined : "_blank"}
                rel="noopener noreferrer"
              >
                {post.link.startsWith("/") ? "Open related page" : "Read more"}
                <ExternalLink />
              </a>
            </Button>
          </div>
        )}
      </article>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="mb-4 text-lg font-semibold">More updates</h2>
        <div className="space-y-3">
          {related.map((item) => (
            <Link
              key={item.slug}
              href={`/updates/${item.slug}`}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-primary/40"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{item.title}</span>
                <span className="block text-xs text-muted-foreground">{item.category}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(item.publishedAt)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
