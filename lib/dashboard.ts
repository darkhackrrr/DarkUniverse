import { getPrisma } from "@/lib/database/client";
import { rewards, badges, rarityOrder } from "@/lib/data/rewards";
import { getTool } from "@/lib/tools/registry";
import type { ActivityEvent, SessionUser, ToolCategory } from "@/types";
import { toolCategories } from "@/types";

export interface SavedToolEntry {
  slug: string;
  name: string | null;
  href: string | null;
  category: string | null;
  savedAt: string | null;
  note: string | null;
}

export interface BadgeState {
  id: string;
  name: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  earned: boolean;
  earnedAt: string | null;
  reason: string;
}

export interface RewardState {
  id: string;
  name: string;
  description: string;
  type: string;
  points: number;
  earned: boolean;
  requirement: string;
}

export interface DashboardData {
  savedTools: SavedToolEntry[];
  activity: ActivityEvent[];
  badgeStates: BadgeState[];
  rewardStates: RewardState[];
  points: number;
  rewardPoints: number;
  nextReward: { name: string; points: number } | null;
  databaseBacked: boolean;
}

const COOKIE = "du_saved_tools";

async function localSavedSlugs(): Promise<string[]> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

export async function getSavedTools(user: SessionUser): Promise<SavedToolEntry[]> {
  const prisma = getPrisma();
  let rows: Array<{ toolSlug: string; note: string | null; createdAt: Date }> = [];

  if (prisma) {
    try {
      rows = await prisma.savedTool.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      rows = [];
    }
  }

  const slugs = rows.length
    ? rows.map((r) => r.toolSlug)
    : await localSavedSlugs();

  const stamp = new Map(rows.map((r) => [r.toolSlug, r]));
  const note = new Map(rows.map((r) => [r.toolSlug, r.note]));

  return slugs.map((slug) => {
    const tool = getTool(slug);
    const row = stamp.get(slug);
    return {
      slug,
      name: tool?.name ?? null,
      href: tool?.href ?? null,
      category: tool?.category ?? null,
      savedAt: row ? row.createdAt.toISOString() : null,
      note: note.get(slug) ?? null,
    };
  });
}

export async function getActivity(user: SessionUser): Promise<ActivityEvent[]> {
  const prisma = getPrisma();
  if (!prisma) return [];
  try {
    const rows = await prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      message: row.message,
      createdAt: row.createdAt.toISOString(),
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    }));
  } catch {
    return [];
  }
}

/**
 * Badges are derived from signals we can actually verify (signed in, Discord
 * linked, saved tools, join date). Nothing is awarded speculatively — badges
 * that require server-side tracking we have not shipped yet stay locked with
 * an honest requirement string.
 */
export function computeBadgeStates(
  user: SessionUser,
  savedTools: SavedToolEntry[],
  rewardPoints: number,
): BadgeState[] {
  const created = new Date(user.createdAt);
  const hubLaunch = new Date("2026-09-01T00:00:00Z");
  const early = created <= new Date(hubLaunch.getTime() + 31 * 86400000);

  const categories = new Set(
    savedTools
      .map((t) => t.category)
      .filter((c): c is ToolCategory => Boolean(c)),
  );
  const covered = toolCategories.filter((c) => categories.has(c)).length;
  const remaining = Math.max(0, toolCategories.length - covered);

  const logic: Record<string, { earned: boolean; reason: string }> = {
    "b-first-login": { earned: true, reason: "Signed in for the first time." },
    "b-tool-saver": {
      earned: savedTools.length >= 1,
      reason:
        savedTools.length >= 1
          ? "Saved a tool to your dashboard."
          : "Save any tool to unlock.",
    },
    "b-explorer": {
      earned: remaining === 0 && savedTools.length >= toolCategories.length,
      reason:
        remaining === 0 && savedTools.length >= toolCategories.length
          ? `Saved a tool from all ${toolCategories.length} categories.`
          : `Save a tool from ${remaining} more ${remaining === 1 ? "category" : "categories"} (${covered}/${toolCategories.length}).`,
    },
    "b-code-hunter": {
      earned: false,
      reason: "Redeem five active game codes — redemption tracking is coming.",
    },
    "b-discord-linked": {
      earned: Boolean(user.discordId),
      reason: user.discordId
        ? "Connected a Discord account."
        : "Sign in with Discord to unlock.",
    },
    "b-early-adopter": {
      earned: early,
      reason: early
        ? "Joined during the Hub's first month."
        : "Joined after the Hub's first month.",
    },
    "b-contributor": {
      earned: false,
      reason: "Staff-awarded when a shipped contribution is credited to you.",
    },
    "b-legend": {
      earned: rewardPoints >= 1000,
      reason:
        rewardPoints >= 1000
          ? "Reached 1,000 community points."
          : `${rewardPoints}/1,000 community points.`,
    },
  };

  return badges.map((badge) => {
    const entry = logic[badge.id] ?? { earned: false, reason: "Keep going." };
    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      rarity: badge.rarity,
      earned: entry.earned,
      earnedAt: entry.earned ? user.createdAt : null,
      reason: entry.reason,
    };
  });
}

export function computeRewardStates(
  savedToolCount: number,
  linked: boolean,
): RewardState[] {
  const logic: Record<string, { earned: boolean; requirement: string }> = {
    "rw-welcome": { earned: true, requirement: "Profile created." },
    "rw-tool-user": {
      earned: savedToolCount >= 3,
      requirement: `Save three tools (${savedToolCount}/3).`,
    },
    "rw-discord-role": {
      earned: linked,
      requirement: linked
        ? "Discord connected — join the server to receive the role."
        : "Link Discord and join the server.",
    },
    "rw-code-hunter": {
      earned: false,
      requirement: "Redeem five active codes (code redemption is coming).",
    },
    "rw-resource-pack": {
      earned: false,
      requirement: "Collect the featured resource pack (coming soon).",
    },
    "rw-veteran": {
      earned: false,
      requirement: "Reach 500 points from other rewards.",
    },
    "rw-creator": {
      earned: false,
      requirement: "Staff nomination only.",
    },
    "rw-partner": {
      earned: false,
      requirement: "Reserved for long-term collaborators.",
    },
  };

  return rewards
    .filter((reward) => reward.active)
    .map((reward) => {
      const entry = logic[reward.id] ?? {
        earned: false,
        requirement: "Keep using the Hub.",
      };
      return {
        id: reward.id,
        name: reward.name,
        description: reward.description,
        type: reward.type,
        points: reward.points,
        earned: entry.earned,
        requirement: entry.requirement,
      };
    });
}

export async function getDashboardData(user: SessionUser): Promise<DashboardData> {
  const [savedTools, activity] = await Promise.all([
    getSavedTools(user),
    getActivity(user),
  ]);

  const rewardStates = computeRewardStates(savedTools.length, Boolean(user.discordId));
  const rewardPoints = rewardStates
    .filter((r) => r.earned)
    .reduce((sum, r) => sum + r.points, 0);

  const badgeStates = computeBadgeStates(user, savedTools, rewardPoints)
    .sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);

  const badgePoints = badgeStates.filter((b) => b.earned).length * 5;
  const points = rewardPoints + badgePoints;

  const upcoming = rewards
    .filter((r) => r.active && r.points > points)
    .map((r) => ({ name: r.name, points: r.points }))
    .sort((a, b) => a.points - b.points);

  return {
    savedTools,
    activity,
    badgeStates,
    rewardStates,
    points,
    rewardPoints,
    nextReward: upcoming[0] ?? null,
    databaseBacked: Boolean(getPrisma()),
  };
}
