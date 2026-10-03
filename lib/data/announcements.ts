import type { Announcement } from "@/types";

/** Latest announcements / patch notes shown on the homepage and /updates. */

export const announcements: Announcement[] = [
  {
    id: "a-1",
    slug: "hub-launch",
    title: "DarkUniverse Hub is here",
    description:
      "One place for every tool, resource and link the community needs — Roblox lookups, image utilities, creator tools and more, all free.",
    category: "Website",
    link: "/tools",
    publishedAt: "2026-10-04",
  },
  {
    id: "a-2",
    slug: "troll-tower-launch",
    title: "Troll Tower: Impossible Obby is live",
    description:
      "Troll traps, fake paths and impossible jumps. Reach the top if you can — the game page here has the direct link and live stats.",
    category: "Games",
    link: "https://www.roblox.com/games/90003169308914/Troll-Tower-Impossible-Obby",
    publishedAt: "2026-10-03",
  },
  {
    id: "a-3",
    slug: "discord-coming-soon",
    title: "Discord server opening soon",
    description:
      "Voice channels, code drops and support are on the way. Follow the Roblox group and YouTube channel in the meantime.",
    category: "Community",
    link: "/community",
    publishedAt: "2026-10-01",
  },
  {
    id: "a-4",
    slug: "youtube-channel",
    title: "DarkUniverse is on YouTube",
    description:
      "Devlogs, clips and community videos land on the DarkUniverse channel — subscribe so you do not miss the next upload.",
    category: "Other",
    link: "https://youtube.com/DarkHackerrr",
    publishedAt: "2026-09-29",
  },
  {
    id: "a-5",
    slug: "roblox-group",
    title: "Join the Roblox group",
    description:
      "Group updates, shoutouts and the fastest way to hear about new releases all live in the DarkUniverse Studios group.",
    category: "Community",
    link: "https://www.roblox.com/share/g/291490614",
    publishedAt: "2026-09-16",
  },
];

export function announcementBySlug(slug: string) {
  return announcements.find((a) => a.slug === slug);
}
