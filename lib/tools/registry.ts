import {
  AtSign,
  BookOpen,
  Braces,
  Calculator,
  CalendarClock,
  CaseSensitive,
  Code2,
  Crop,
  FileImage,
  FileJson,
  FileText,
  Gamepad2,
  Hash,
  Image as ImageIcon,
  Images,
  Link2,
  MessageSquare,
  Palette,
  QrCode,
  Ruler,
  ScanLine,
  Server,
  Shuffle,
  Sparkles,
  Tags,
  Terminal,
  Type,
  UserRound,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { YoutubeIcon } from "@/components/icons";
import type { Tool, ToolCategory } from "@/types";

/**
 * Single source of truth for the tools directory.
 *
 * Add an entry here and (optionally) a page component under
 * `components/tools/` registered in `components/tools/registry.tsx`.
 */

export const categories: ToolCategory[] = [
  "Roblox",
  "Discord",
  "Creator",
  "YouTube",
  "Images",
  "Utilities",
];

export const tools: Tool[] = [
  // ── Roblox ────────────────────────────────────────────────────────────────
  {
    slug: "roblox-profile-lookup",
    name: "Roblox Profile Lookup",
    description:
      "View any public Roblox profile — avatar, bio, friend and follower counts, join date and more.",
    category: "Roblox",
    icon: UserRound,
    href: "/tools/roblox-profile-lookup",
    featured: true,
    keywords: ["user", "profile", "lookup", "avatar"],
  },
  {
    slug: "roblox-avatar-viewer",
    name: "Roblox Avatar Viewer",
    description:
      "Render any user's current avatar in full resolution, including equipped accessories.",
    category: "Roblox",
    icon: Images,
    href: "/tools/roblox-avatar-viewer",
    keywords: ["avatar", "character", "render"],
  },
  {
    slug: "roblox-user-id-lookup",
    name: "Roblox User ID Lookup",
    description:
      "Convert a Roblox username to its numeric user ID (and the other way around).",
    category: "Roblox",
    icon: Hash,
    href: "/tools/roblox-user-id-lookup",
    keywords: ["userid", "id", "convert"],
  },
  {
    slug: "roblox-group-lookup",
    name: "Roblox Group Lookup",
    description:
      "Inspect any Roblox group — member count, description, owner and shout.",
    category: "Roblox",
    icon: Users,
    href: "/tools/roblox-group-lookup",
    keywords: ["group", "clan", "members"],
  },
  {
    slug: "roblox-game-lookup",
    name: "Roblox Game Lookup",
    description:
      "Pull live game details from a place ID or URL — visits, likes, playing count and creator.",
    category: "Roblox",
    icon: Gamepad2,
    href: "/tools/roblox-game-lookup",
    featured: true,
    keywords: ["game", "place", "universe", "stats"],
  },
  {
    slug: "roblox-game-thumbnail-viewer",
    name: "Roblox Game Thumbnail Viewer",
    description:
      "Browse every thumbnail image for a Roblox experience in full size.",
    category: "Roblox",
    icon: ImageIcon,
    href: "/tools/roblox-game-thumbnail-viewer",
    keywords: ["thumbnail", "image", "screenshots"],
  },
  {
    slug: "roblox-game-icon-viewer",
    name: "Roblox Game Icon Viewer",
    description:
      "Fetch and preview the square icon artwork used for a Roblox experience.",
    category: "Roblox",
    icon: ScanLine,
    href: "/tools/roblox-game-icon-viewer",
    keywords: ["icon", "game", "art"],
  },
  {
    slug: "roblox-group-icon-viewer",
    name: "Roblox Group Icon Viewer",
    description:
      "Preview the uploaded icon of any Roblox group at maximum size.",
    category: "Roblox",
    icon: FileImage,
    href: "/tools/roblox-group-icon-viewer",
    keywords: ["group", "icon", "logo"],
  },
  {
    slug: "roblox-presence-lookup",
    name: "Roblox Presence Lookup",
    description:
      "Check whether a user is online, in a game, or offline — and what they're playing.",
    category: "Roblox",
    icon: Zap,
    href: "/tools/roblox-presence-lookup",
    keywords: ["online", "status", "playing"],
  },
  {
    slug: "roblox-server-status",
    name: "Roblox Server Status",
    description:
      "Live status of Roblox platform services — APIs, website, studio and multiplayer.",
    category: "Roblox",
    icon: Server,
    href: "/tools/roblox-server-status",
    keywords: ["status", "outage", "uptime"],
  },
  {
    slug: "roblox-username-lookup",
    name: "Roblox Username Lookup",
    description:
      "Resolve a username and see its history, including previously used names.",
    category: "Roblox",
    icon: AtSign,
    href: "/tools/roblox-username-lookup",
    keywords: ["username", "history", "renames"],
  },
  {
    slug: "roblox-outfit-viewer",
    name: "Roblox Outfit Viewer",
    description:
      "Browse the saved outfits of any Roblox user and preview each one.",
    category: "Roblox",
    icon: Sparkles,
    href: "/tools/roblox-outfit-viewer",
    keywords: ["outfit", "costume", "clothing"],
  },

  // ── Discord ───────────────────────────────────────────────────────────────
  {
    slug: "discord-timestamp-generator",
    name: "Discord Timestamp Generator",
    description:
      "Generate <t:...> timestamp strings that render in every member's local timezone.",
    category: "Discord",
    icon: CalendarClock,
    href: "/tools/discord-timestamp-generator",
    featured: true,
    keywords: ["timestamp", "time", "format"],
  },
  {
    slug: "discord-embed-builder",
    name: "Discord Embed Builder",
    description:
      "Design rich embeds with a live preview, then copy the JSON straight into your bot or webhook.",
    category: "Discord",
    icon: MessageSquare,
    href: "/tools/discord-embed-builder",
    featured: true,
    keywords: ["embed", "webhook", "bot", "json"],
  },
  {
    slug: "discord-webhook-builder",
    name: "Discord Webhook Message Builder",
    description:
      "Compose a webhook payload (content, username, avatar) and copy it ready to POST.",
    category: "Discord",
    icon: Link2,
    href: "/tools/discord-webhook-builder",
    keywords: ["webhook", "message", "payload"],
  },
  {
    slug: "discord-snowflake-decoder",
    name: "Discord Snowflake Decoder",
    description:
      "Decode any Discord ID into its exact creation timestamp, worker and process ID.",
    category: "Discord",
    icon: Braces,
    href: "/tools/discord-snowflake-decoder",
    keywords: ["snowflake", "id", "decode"],
  },
  {
    slug: "discord-invite-info",
    name: "Discord Invite Information",
    description:
      "Look up server name, member count, vanity and expiry for any invite link.",
    category: "Discord",
    icon: Users,
    href: "/tools/discord-invite-info",
    keywords: ["invite", "server", "lookup"],
  },
  {
    slug: "discord-color-converter",
    name: "Discord Color Converter",
    description:
      "Convert embed colours between HEX, RGB, HSL and Discord's decimal integer.",
    category: "Discord",
    icon: Palette,
    href: "/tools/discord-color-converter",
    keywords: ["color", "colour", "hex", "rgb"],
  },
  {
    slug: "discord-avatar-preview",
    name: "Discord Avatar Preview",
    description:
      "Preview a Discord user's avatar at every supported size and format.",
    category: "Discord",
    icon: UserRound,
    href: "/tools/discord-avatar-preview",
    keywords: ["avatar", "pfp", "profile"],
  },
  {
    slug: "discord-banner-preview",
    name: "Discord Banner Preview",
    description:
      "Preview profile banners and server banners in their original resolution.",
    category: "Discord",
    icon: ImageIcon,
    href: "/tools/discord-banner-preview",
    keywords: ["banner", "profile", "server"],
  },

  // ── Creator ───────────────────────────────────────────────────────────────
  {
    slug: "username-generator",
    name: "Username Generator",
    description:
      "Generate clean, available-style usernames with style presets for games and socials.",
    category: "Creator",
    icon: Shuffle,
    href: "/tools/username-generator",
    featured: true,
    keywords: ["username", "name", "generator", "handle"],
  },
  {
    slug: "discord-bio-generator",
    name: "Discord Bio Generator",
    description:
      "Write a sharp Discord bio from a few keywords — under the 190 character limit.",
    category: "Creator",
    icon: Type,
    href: "/tools/discord-bio-generator",
    keywords: ["bio", "about", "profile"],
  },
  {
    slug: "roblox-game-description-formatter",
    name: "Roblox Game Description Formatter",
    description:
      "Structure a Roblox game description with headings, bullet points and clean spacing.",
    category: "Creator",
    icon: FileText,
    href: "/tools/roblox-game-description-formatter",
    keywords: ["description", "game", "format"],
  },
  {
    slug: "text-formatter",
    name: "Text Formatter",
    description:
      "Clean up text — strip extra spaces, normalise line endings, sort and deduplicate lines.",
    category: "Creator",
    icon: CaseSensitive,
    href: "/tools/text-formatter",
    keywords: ["format", "clean", "text"],
  },
  {
    slug: "color-palette-generator",
    name: "Color Palette Generator",
    description:
      "Build harmonious colour palettes from a base hue with exportable hex values.",
    category: "Creator",
    icon: Palette,
    href: "/tools/color-palette-generator",
    keywords: ["color", "palette", "design"],
  },
  {
    slug: "gradient-generator",
    name: "Gradient Generator",
    description:
      "Craft CSS gradients with live preview and copy the gradient string instantly.",
    category: "Creator",
    icon: Zap,
    href: "/tools/gradient-generator",
    keywords: ["gradient", "css", "background"],
  },

  // ── YouTube ───────────────────────────────────────────────────────────────
  {
    slug: "youtube-title-generator",
    name: "YouTube Title Generator",
    description:
      "Generate clickable, character-safe YouTube titles from your video topic.",
    category: "YouTube",
    icon: YoutubeIcon,
    href: "/tools/youtube-title-generator",
    keywords: ["title", "youtube", "ctr"],
  },
  {
    slug: "youtube-description-formatter",
    name: "YouTube Description Formatter",
    description:
      "Build structured video descriptions with timestamps, links and sections.",
    category: "YouTube",
    icon: FileText,
    href: "/tools/youtube-description-formatter",
    keywords: ["description", "timestamps", "chapters"],
  },
  {
    slug: "youtube-tags-generator",
    name: "YouTube Tags Generator",
    description:
      "Produce relevant tag sets sized to YouTube's 500-character limit.",
    category: "YouTube",
    icon: Tags,
    href: "/tools/youtube-tags-generator",
    keywords: ["tags", "seo", "keywords"],
  },

  // ── Images ────────────────────────────────────────────────────────────────
  {
    slug: "image-resizer",
    name: "Image Resizer",
    description:
      "Resize images to exact dimensions or a percentage scale — processed entirely in your browser.",
    category: "Images",
    icon: Ruler,
    href: "/tools/image-resizer",
    keywords: ["resize", "scale", "dimensions"],
  },
  {
    slug: "image-cropper",
    name: "Image Cropper",
    description:
      "Crop images with a draggable selection and export the result at full quality.",
    category: "Images",
    icon: Crop,
    href: "/tools/image-cropper",
    keywords: ["crop", "trim", "cut"],
  },
  {
    slug: "image-compressor",
    name: "Image Compressor",
    description:
      "Shrink file size with adjustable quality while keeping images looking sharp.",
    category: "Images",
    icon: FileImage,
    href: "/tools/image-compressor",
    keywords: ["compress", "optimize", "quality"],
  },
  {
    slug: "image-converter",
    name: "PNG / JPG / WebP Converter",
    description:
      "Convert images between PNG, JPEG and WebP without uploading anything.",
    category: "Images",
    icon: Images,
    href: "/tools/image-converter",
    keywords: ["convert", "png", "jpg", "webp"],
  },
  {
    slug: "image-dimensions-viewer",
    name: "Image Dimensions Viewer",
    description:
      "Read exact pixel dimensions, file type and colour space for any image.",
    category: "Images",
    icon: Ruler,
    href: "/tools/image-dimensions-viewer",
    keywords: ["dimensions", "width", "height"],
  },
  {
    slug: "file-size-viewer",
    name: "File Size Viewer",
    description:
      "Inspect file sizes in bytes, KB, MB and GB with a clear breakdown.",
    category: "Images",
    icon: Calculator,
    href: "/tools/file-size-viewer",
    keywords: ["filesize", "bytes", "storage"],
  },

  // ── Utilities ─────────────────────────────────────────────────────────────
  {
    slug: "character-counter",
    name: "Character Counter",
    description:
      "Count characters, words, sentences and reading time as you type.",
    category: "Utilities",
    icon: Type,
    href: "/tools/character-counter",
    keywords: ["count", "character", "limit"],
  },
  {
    slug: "word-counter",
    name: "Word Counter",
    description:
      "Count words and lines with a live breakdown of the most used words.",
    category: "Utilities",
    icon: BookOpen,
    href: "/tools/word-counter",
    keywords: ["words", "count", "frequency"],
  },
  {
    slug: "json-formatter",
    name: "JSON Formatter",
    description:
      "Format, minify and validate JSON with clear error locations.",
    category: "Utilities",
    icon: FileJson,
    href: "/tools/json-formatter",
    keywords: ["json", "format", "validate", "minify"],
  },
  {
    slug: "timestamp-generator",
    name: "Timestamp Generator",
    description:
      "Convert dates to Unix timestamps (seconds or milliseconds) and back again.",
    category: "Utilities",
    icon: CalendarClock,
    href: "/tools/timestamp-generator",
    keywords: ["unix", "epoch", "date", "time"],
  },
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    description:
      "Generate downloadable QR codes for links, text and Wi-Fi details.",
    category: "Utilities",
    icon: QrCode,
    href: "/tools/qr-code-generator",
    keywords: ["qr", "code", "scan"],
  },
  {
    slug: "code-snippet-formatter",
    name: "Code Snippet Formatter",
    description:
      "Tidy up pasted code — normalise indentation, trim trailing spaces and wrap for Discord.",
    category: "Utilities",
    icon: Terminal,
    href: "/tools/code-snippet-formatter",
    keywords: ["code", "indent", "snippet", "discord"],
  },
  {
    slug: "random-picker",
    name: "Random Picker",
    description:
      "Pick a random winner, team or item from a list — great for giveaways.",
    category: "Utilities",
    icon: Wrench,
    href: "/tools/random-picker",
    keywords: ["random", "winner", "giveaway", "shuffle"],
  },
  {
    slug: "base64-tool",
    name: "Base64 Encode / Decode",
    description:
      "Encode text to Base64 and decode it back, safely handling Unicode.",
    category: "Utilities",
    icon: Code2,
    href: "/tools/base64-tool",
    keywords: ["base64", "encode", "decode"],
  },
];

const bySlug = new Map(tools.map((t) => [t.slug, t]));

export function getTool(slug: string): Tool | undefined {
  return bySlug.get(slug);
}

export function featuredTools(limit = 4): Tool[] {
  const featured = tools.filter((t) => t.featured);
  const filler = tools.filter((t) => !t.featured);
  return [...featured, ...filler].slice(0, limit);
}

export function toolsByCategory(category: ToolCategory): Tool[] {
  return tools.filter((t) => t.category === category);
}
