/**
 * Central configuration for DarkUniverse Hub.
 *
 * Public values (NEXT_PUBLIC_*) are inlined at build time and are safe to
 * expose to the browser. Everything else is read at runtime on the server.
 */

const env = process.env;

export const siteConfig = {
  name: "DarkUniverse Hub",
  studio: "DarkUniverse Studios",
  shortName: "DU",
  tagline: "Tools, resources & experiences for the DarkUniverse community.",
  description:
    "DarkUniverse Hub is the all-in-one community hub for DarkUniverse Studios — Roblox tools, Discord utilities, creator resources, game codes, rewards and more.",
  url: env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000",
  locale: "en_US",
  keywords: [
    "DarkUniverse",
    "DarkUniverse Studios",
    "Roblox tools",
    "Discord tools",
    "game codes",
    "creator tools",
    "community hub",
  ],
} as const;

export const communityLinks = {
  /**
   * null = not launched yet. Components render a "coming soon" state instead
   * of a link while this is null. Set NEXT_PUBLIC_DISCORD_URL when the server
   * is public.
   */
  discord: env.NEXT_PUBLIC_DISCORD_URL ?? null,
  youtube: env.NEXT_PUBLIC_YOUTUBE_URL ?? "https://youtube.com/DarkHackerrr",
  robloxGroup:
    env.NEXT_PUBLIC_ROBLOX_GROUP_URL ?? "https://www.roblox.com/share/g/291490614",
} as const;

/** Manually maintained community stats shown on /community. */
export const communityStats = {
  /** null = not published yet, rendered as "Coming soon". */
  discordMembers: null as number | null,
  youtubeSubscribers: 21,
  robloxGroupMembers: 1,
  toolsPublished: 43,
  gamesLive: 1,
} as const;

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/tools", label: "Tools" },
  { href: "/games", label: "Games" },
  { href: "/codes", label: "Codes" },
  { href: "/resources", label: "Resources" },
  { href: "/community", label: "Community" },
] as const;

export const dashboardNav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/tools", label: "Tools" },
  { href: "/dashboard/rewards", label: "Rewards" },
  { href: "/dashboard/badges", label: "Badges" },
  { href: "/dashboard/games", label: "Games" },
  { href: "/dashboard/settings", label: "Settings" },
] as const;

export const adminNav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/games", label: "Games" },
  { href: "/admin/codes", label: "Codes" },
  { href: "/admin/tools", label: "Tools" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/rewards", label: "Rewards" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/logs", label: "Logs" },
] as const;

export const announcementCategories = [
  "Games",
  "Website",
  "Community",
  "Events",
  "Other",
] as const;

export const gameGenres = [
  "Obby",
  "Adventure",
  "Simulator",
  "Tycoon",
  "PvP",
  "Horror",
  "Roleplay",
  "Puzzle",
  "Racing",
  "Sandbox",
  "Other",
] as const;

export const resourceCategories = [
  "Roblox Development",
  "Discord",
  "YouTube",
  "Content Creation",
  "Developer Tools",
] as const;

export const toolCategories = [
  "Roblox",
  "Discord",
  "Creator",
  "YouTube",
  "Images",
  "Utilities",
] as const;

/** Server-side admin Discord user IDs (comma separated in .env). */
export function adminDiscordIds(): string[] {
  return (env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isOAuthConfigured(): boolean {
  return Boolean(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET);
}

export function isDatabaseConfigured(): boolean {
  return Boolean(env.DATABASE_URL);
}
