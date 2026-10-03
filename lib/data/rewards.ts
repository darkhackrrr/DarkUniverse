import type { Badge, Reward } from "@/types";

/**
 * Reward tiers and badges.
 *
 * Progress is tracked per-user (points + earned badges). YouTube subscription
 * checks are intentionally NOT faked — see `verification` on each reward.
 * When OAuth integrations are added later, flip `verification` to the provider
 * and implement the matching server-side check.
 */

export const rewards: Reward[] = [
  {
    id: "rw-welcome",
    name: "Newcomer",
    description: "Join the Hub and create your profile.",
    type: "badge",
    points: 10,
    active: true,
  },
  {
    id: "rw-tool-user",
    name: "Tool Regular",
    description: "Save three tools to your dashboard.",
    type: "badge",
    points: 25,
    active: true,
  },
  {
    id: "rw-discord-role",
    name: "Community Insider",
    description:
      "Link your Discord account and join the server to unlock the Insider role.",
    type: "discord-role",
    points: 50,
    active: true,
  },
  {
    id: "rw-code-hunter",
    name: "Code Hunter",
    description: "Redeem five active game codes from the codes directory.",
    type: "game-code",
    points: 60,
    active: true,
  },
  {
    id: "rw-resource-pack",
    name: "Fully Loaded",
    description: "Collect the featured resource pack from /resources.",
    type: "resource",
    points: 40,
    active: true,
  },
  {
    id: "rw-veteran",
    name: "DarkUniverse Veteran",
    description: "Earn 500 points across the community.",
    type: "title",
    points: 500,
    active: true,
  },
  {
    id: "rw-creator",
    name: "Featured Creator",
    description:
      "Get featured in the community spotlight. Nominated by the team — not self-serve.",
    type: "badge",
    points: 250,
    active: true,
  },
  {
    id: "rw-partner",
    name: "Studio Partner",
    description:
      "Reserved for long-term collaborators. Includes a permanent Discord role.",
    type: "discord-role",
    points: 1000,
    active: false,
  },
];

export const badges: Badge[] = [
  {
    id: "b-first-login",
    name: "First Login",
    description: "Signed in for the first time.",
    icon: "Sparkles",
    rarity: "common",
  },
  {
    id: "b-tool-saver",
    name: "Tool Saver",
    description: "Saved a tool to your dashboard.",
    icon: "Bookmark",
    rarity: "common",
  },
  {
    id: "b-explorer",
    name: "Explorer",
    description: "Visited every tools category.",
    icon: "Compass",
    rarity: "common",
  },
  {
    id: "b-code-hunter",
    name: "Code Hunter",
    description: "Redeemed five game codes.",
    icon: "Ticket",
    rarity: "rare",
  },
  {
    id: "b-discord-linked",
    name: "Discord Linked",
    description: "Connected a Discord account.",
    icon: "MessagesSquare",
    rarity: "rare",
  },
  {
    id: "b-early-adopter",
    name: "Early Adopter",
    description: "Joined during the Hub's first month.",
    icon: "Rocket",
    rarity: "epic",
  },
  {
    id: "b-contributor",
    name: "Contributor",
    description: "Submitted a resource or tool idea that shipped.",
    icon: "GitPullRequest",
    rarity: "epic",
  },
  {
    id: "b-legend",
    name: "Legend of the Void",
    description: "Reached 1,000 community points.",
    icon: "Crown",
    rarity: "legendary",
  },
];

export const rarityOrder: Record<Badge["rarity"], number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

export function activeRewardCount(): number {
  return rewards.filter((r) => r.active).length;
}
