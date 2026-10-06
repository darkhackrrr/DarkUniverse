import { getPrisma } from "@/lib/database/client";

export interface ShopItem {
  id: string;
  emoji: string;
  name: string;
  price: number;
  description: string;
}

export const SHOP: ShopItem[] = [
  { id: "balloon", emoji: "🎈", name: "Balloon", price: 50, description: "A very poppable balloon." },
  { id: "cake", emoji: "🍰", name: "Cake", price: 150, description: "Freshly baked, +0 calories." },
  { id: "cat", emoji: "🐈", name: "Cat", price: 300, description: "It ignores you. As it should." },
  { id: "scroll", emoji: "📜", name: "Ancient Scroll", price: 500, description: "Wisdom not included." },
  { id: "ticket", emoji: "🎟️", name: "Lottery Ticket", price: 750, description: "Probably a winner." },
  { id: "diamond", emoji: "💎", name: "Diamond", price: 2500, description: "Shiny and mostly useless." },
  { id: "crown", emoji: "👑", name: "Crown", price: 10000, description: "For the truly unhinged rich." },
];

export interface EconomyRecord {
  guildId: string;
  userId: string;
  balance: number;
  bank: number;
  inventory: string[];
  dailyAt: Date | null;
  workAt: Date | null;
  gambleAt: Date | null;
  robAt: Date | null;
  streak: number;
}

export async function getEconomy(
  guildId: string,
  userId: string,
): Promise<EconomyRecord | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const existing = await prisma.economy.findUnique({
    where: { guildId_userId: { guildId, userId } },
  });
  if (existing) return existing;
  return prisma.economy.create({ data: { guildId, userId } });
}

export async function patchEconomy(
  guildId: string,
  userId: string,
  data: Partial<{
    balance: number;
    bank: number;
    inventory: string[];
    dailyAt: Date | null;
    workAt: Date | null;
    gambleAt: Date | null;
    robAt: Date | null;
    streak: number;
  }>,
): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  await prisma.economy.upsert({
    where: { guildId_userId: { guildId, userId } },
    create: { guildId, userId, ...data },
    update: data,
  });
}

export function coins(amount: number): string {
  return `${amount.toLocaleString("en-US")} 🪙`;
}
