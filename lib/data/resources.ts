import type { Resource } from "@/types";

/**
 * Curated resource library. Every entry must link to a real, useful page.
 */

export const resources: Resource[] = [
  // ── Roblox Development ────────────────────────────────────────────────────
  {
    id: "r-roblox-docs",
    name: "Roblox Creator Docs",
    description:
      "Official documentation for Luau, building, networking and publishing on Roblox.",
    category: "Roblox Development",
    url: "https://create.roblox.com/docs",
    tags: ["official", "docs", "luau"],
    featured: true,
  },
  {
    id: "r-devforum",
    name: "Roblox DevForum",
    description:
      "The community forum where developers ask questions and share techniques.",
    category: "Roblox Development",
    url: "https://devforum.roblox.com",
    tags: ["community", "support"],
    featured: true,
  },
  {
    id: "r-luau",
    name: "Luau Language Reference",
    description:
      "Type system, metatables and the standard library for the Luau scripting language.",
    category: "Roblox Development",
    url: "https://create.roblox.com/docs/reference/engine/classes/Luau",
    tags: ["luau", "reference"],
  },
  {
    id: "r-rojo",
    name: "Rojo",
    description:
      "Sync Roblox projects from your filesystem with VS Code — the standard developer workflow.",
    category: "Roblox Development",
    url: "https://rojo.space",
    tags: ["tooling", "vscode", "sync"],
    featured: true,
  },
  {
    id: "r-wally",
    name: "Wally",
    description:
      "Package manager for Roblox — install and version libraries across projects.",
    category: "Roblox Development",
    url: "https://github.com/UpliftGames/wally",
    downloadUrl: "https://github.com/UpliftGames/wally/releases",
    tags: ["packages", "tooling"],
  },
  {
    id: "r-studio-plugins",
    name: "Roblox Studio Plugins",
    description:
      "Browse community-built Studio plugins to speed up building and scripting.",
    category: "Roblox Development",
    url: "https://create.roblox.com/store",
    tags: ["studio", "plugins"],
  },
  {
    id: "r-open-cloud",
    name: "Roblox Open Cloud",
    description:
      "REST APIs for publishing, data stores, messaging and inventory management.",
    category: "Roblox Development",
    url: "https://create.roblox.com/docs/cloud",
    tags: ["api", "cloud"],
  },

  // ── Discord ───────────────────────────────────────────────────────────────
  {
    id: "r-discord-dev",
    name: "Discord Developer Portal",
    description:
      "Create applications, manage OAuth2 redirects and read the bot API reference.",
    category: "Discord",
    url: "https://discord.com/developers/applications",
    tags: ["official", "bot", "oauth"],
    featured: true,
  },
  {
    id: "r-discord-docs",
    name: "Discord API Documentation",
    description:
      "Full REST, gateway and webhook reference for building Discord integrations.",
    category: "Discord",
    url: "https://discord.com/developers/docs/intro",
    tags: ["docs", "api"],
  },
  {
    id: "r-discord-markdown",
    name: "Discord Markdown Guide",
    description:
      "Formatting rules for bold, code blocks, timestamps and mentions.",
    category: "Discord",
    url: "https://discord.com/channels/@me",
    tags: ["formatting", "guide"],
  },
  {
    id: "r-discord-safety",
    name: "Discord Safety & Moderation",
    description:
      "Best practices for running a safe, well-moderated community server.",
    category: "Discord",
    url: "https://discord.com/safety",
    tags: ["moderation", "safety"],
  },

  // ── YouTube ───────────────────────────────────────────────────────────────
  {
    id: "r-yt-studio",
    name: "YouTube Studio",
    description:
      "Upload videos, manage analytics, comments and monetisation settings.",
    category: "YouTube",
    url: "https://studio.youtube.com",
    tags: ["official", "analytics"],
    featured: true,
  },
  {
    id: "r-yt-creators",
    name: "YouTube Creator Academy",
    description:
      "Free courses on packaging, retention, storytelling and channel growth.",
    category: "YouTube",
    url: "https://creatoracademy.youtube.com",
    tags: ["growth", "courses"],
  },
  {
    id: "r-yt-audio",
    name: "YouTube Audio Library",
    description:
      "Royalty-free music and sound effects cleared for use in your videos.",
    category: "YouTube",
    url: "https://studio.youtube.com/channel/UC/music",
    tags: ["music", "assets"],
  },
  {
    id: "r-yt-shorts",
    name: "YouTube Shorts Guide",
    description:
      "Format, length and best practices for short-form vertical video.",
    category: "YouTube",
    url: "https://www.youtube.com/creators/shorts/",
    tags: ["shorts", "growth"],
  },

  // ── Content Creation ──────────────────────────────────────────────────────
  {
    id: "r-obs",
    name: "OBS Studio",
    description:
      "Free, open-source recording and live streaming software.",
    category: "Content Creation",
    url: "https://obsproject.com",
    downloadUrl: "https://obsproject.com/download",
    tags: ["streaming", "recording", "free"],
    featured: true,
  },
  {
    id: "r-davinci",
    name: "DaVinci Resolve",
    description:
      "Professional colour grading, editing and audio in one free application.",
    category: "Content Creation",
    url: "https://www.blackmagicdesign.com/products/davinciresolve",
    downloadUrl: "https://www.blackmagicdesign.com/products/davinciresolve",
    tags: ["editing", "free"],
  },
  {
    id: "r-gimp",
    name: "GIMP",
    description:
      "Cross-platform image editor for thumbnails, assets and overlays.",
    category: "Content Creation",
    url: "https://www.gimp.org",
    downloadUrl: "https://www.gimp.org/downloads/",
    tags: ["thumbnails", "free"],
  },
  {
    id: "r-canva",
    name: "Canva",
    description:
      "Fast template-driven design for thumbnails, banners and shorts.",
    category: "Content Creation",
    url: "https://www.canva.com",
    tags: ["design", "thumbnails"],
  },
  {
    id: "r-audacity",
    name: "Audacity",
    description:
      "Free audio recorder and editor for voiceovers and podcasts.",
    category: "Content Creation",
    url: "https://www.audacityteam.org",
    downloadUrl: "https://www.audacityteam.org/download/",
    tags: ["audio", "free"],
  },

  // ── Developer Tools ───────────────────────────────────────────────────────
  {
    id: "r-vscode",
    name: "Visual Studio Code",
    description:
      "Lightweight editor with the extensions most Roblox workflows rely on.",
    category: "Developer Tools",
    url: "https://code.visualstudio.com",
    downloadUrl: "https://code.visualstudio.com/download",
    tags: ["editor", "free"],
    featured: true,
  },
  {
    id: "r-github",
    name: "GitHub",
    description:
      "Host repositories, track issues and collaborate on game and tool code.",
    category: "Developer Tools",
    url: "https://github.com",
    tags: ["git", "hosting"],
  },
  {
    id: "r-selene",
    name: "Selene",
    description:
      "Fast Luau linter that catches common scripting mistakes before publish.",
    category: "Developer Tools",
    url: "https://github.com/Kampfkarren/selene",
    downloadUrl: "https://github.com/Kampfkarren/selene/releases",
    tags: ["linter", "luau"],
  },
  {
    id: "r-stylua",
    name: "StyLua",
    description:
      "Opinionated code formatter for Luau — consistent style across your team.",
    category: "Developer Tools",
    url: "https://github.com/JohnnyMorganz/StyLua",
    downloadUrl: "https://github.com/JohnnyMorganz/StyLua/releases",
    tags: ["formatter", "luau"],
  },
  {
    id: "r-postman",
    name: "Postman",
    description:
      "Design, test and document HTTP APIs — useful for Open Cloud integrations.",
    category: "Developer Tools",
    url: "https://www.postman.com",
    tags: ["api", "testing"],
  },
];
