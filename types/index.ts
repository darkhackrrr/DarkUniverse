import type { ComponentType, SVGProps } from "react";

// ---------------------------------------------------------------------------
// Tooling
// ---------------------------------------------------------------------------

export const toolCategories = [
  "Roblox",
  "Discord",
  "Creator",
  "YouTube",
  "Images",
  "Utilities",
] as const;

export type ToolCategory = (typeof toolCategories)[number];

export interface Tool {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  href: string;
  featured?: boolean;
  keywords?: string[];
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export interface Game {
  id: string;
  slug: string;
  name: string;
  description: string;
  genre: string;
  status: "Live" | "Beta" | "Testing" | "Development";
  players: number;
  robloxUrl: string;
  thumbUrl?: string | null;
  universeId?: string | null;
  featured?: boolean;
  update?: {
    version: string;
    notes: string;
    date: string;
  };
}

export interface GameCode {
  id: string;
  code: string;
  reward: string;
  status: "active" | "expired" | "upcoming";
  expiresAt?: string | null;
  gameId?: string | null;
  gameName?: string;
  gameSlug?: string;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  downloadUrl?: string | null;
  tags: string[];
  featured?: boolean;
}

export interface Announcement {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string | null;
  link?: string | null;
  publishedAt: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: "badge" | "discord-role" | "game-code" | "resource" | "title";
  points: number;
  active: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon?: string | null;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface ActivityEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Auth / session
// ---------------------------------------------------------------------------

export type Role = "USER" | "ADMIN";

export interface SessionUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  email: string | null;
  discordId: string | null;
  role: Role;
  points: number;
  isBotVerified: boolean;
  bio?: string | null;
  createdAt: string;
}

export interface ConnectedAccount {
  provider: string;
  providerAccountId: string;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export type SearchResultType =
  | "tool"
  | "game"
  | "code"
  | "resource"
  | "announcement";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  href: string;
  badge?: string;
}
