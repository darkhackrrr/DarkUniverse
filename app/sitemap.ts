import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { tools } from "@/lib/tools/registry";
import { listAnnouncements, listGames } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base = siteConfig.url;
  const [games, announcements] = await Promise.all([
    listGames(),
    listAnnouncements(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/tools",
    "/games",
    "/codes",
    "/resources",
    "/community",
    "/rewards",
    "/updates",
    "/about",
    "/privacy",
    "/terms",
    "/login",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : path === "/tools" ? 0.9 : 0.7,
  }));

  const toolRoutes: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: `${base}${tool.href}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const gameRoutes: MetadataRoute.Sitemap = games.map((game) => ({
    url: `${base}/games/${game.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const updateRoutes: MetadataRoute.Sitemap = announcements.map((post) => ({
    url: `${base}/updates/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...toolRoutes, ...gameRoutes, ...updateRoutes];
}
