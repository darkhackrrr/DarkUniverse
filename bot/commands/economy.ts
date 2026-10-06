import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { SHOP, coins, getEconomy, patchEconomy } from "../lib/economy";
import { pick, randInt } from "../lib/random";
import type { BotCommand } from "./types";

const ACCENT = 0x8b7cf8;

const WORK_JOBS = [
  "delivering pizzas",
  "moderating a chaos server",
  "debugging in production",
  "walking dogs for coins",
  "speedrunning homework",
  "unboxing mystery crates",
  "streaming to 3 viewers",
  "trading dubious crypto",
];

function embed(title: string, description?: string) {
  const e = new EmbedBuilder().setColor(ACCENT).setTitle(title);
  if (description) e.setDescription(description);
  return e;
}

function parseAmount(input: string | null, available: number): number | null {
  if (input === null) return null;
  const raw = input.trim().toLowerCase();
  if (raw === "all" || raw === "max") return available;
  const amount = Number(raw);
  if (!Number.isInteger(amount) || amount <= 0) return null;
  return amount;
}

async function withEconomy(
  interaction: ChatInputCommandInteraction,
): Promise<
  | {
      balance: number;
      bank: number;
      inventory: string[];
      dailyAt: Date | null;
      workAt: Date | null;
      gambleAt: Date | null;
      robAt: Date | null;
      streak: number;
    }
  | null
> {
  await interaction.deferReply();
  const record = await getEconomy(interaction.guildId!, interaction.user.id);
  if (!record) {
    await interaction.editReply("Database unavailable — economy is offline.");
    return null;
  }
  return record;
}

const balanceCommand: BotCommand = {
  category: "Economy",
  data: new SlashCommandBuilder().setName("balance").setDescription("Check your wallet and bank"),
  async execute(interaction) {
    const record = await withEconomy(interaction);
    if (!record) return;
    const total = record.balance + record.bank;
    await interaction.editReply({
      embeds: [
        embed(`💰 ${interaction.user.username}'s finances`).addFields(
          { name: "Wallet", value: coins(record.balance), inline: true },
          { name: "Bank", value: coins(record.bank), inline: true },
          { name: "Net worth", value: coins(total), inline: true },
          { name: "Streak", value: `🔥 ${record.streak} day(s)`, inline: true },
        ),
      ],
    });
  },
};

const dailyCommand: BotCommand = {
  category: "Economy",
  data: new SlashCommandBuilder().setName("daily").setDescription("Claim your daily reward"),
  async execute(interaction) {
    const record = await withEconomy(interaction);
    if (!record) return;
    const now = Date.now();
    if (record.dailyAt && now - record.dailyAt.getTime() < 20 * 3_600_000) {
      const nextIn = 20 * 3_600_000 - (now - record.dailyAt.getTime());
      await interaction.editReply(
        `You already claimed your daily. Come back <t:${Math.floor((now + nextIn) / 1000)}:R>.`,
      );
      return;
    }
    const consecutive =
      record.dailyAt && now - record.dailyAt.getTime() < 32 * 3_600_000
        ? record.streak + 1
        : 1;
    const base = randInt(100, 300);
    const bonus = Math.min(100, consecutive * 10);
    const total = base + bonus;
    await patchEconomy(interaction.guildId!, interaction.user.id, {
      balance: record.balance + total,
      dailyAt: new Date(),
      streak: consecutive,
    });
    await interaction.editReply(
      `🎁 You claimed **${coins(total)}** (${coins(base)} base + ${coins(bonus)} streak bonus).\n` +
        `🔥 Daily streak: **${consecutive}** day(s).`,
    );
  },
};

const workCommand: BotCommand = {
  category: "Economy",
  data: new SlashCommandBuilder().setName("work").setDescription("Work a shift to earn coins"),
  async execute(interaction) {
    const record = await withEconomy(interaction);
    if (!record) return;
    const now = Date.now();
    if (record.workAt && now - record.workAt.getTime() < 20 * 60_000) {
      const nextIn = 20 * 60_000 - (now - record.workAt.getTime());
      await interaction.editReply(
        `You're still exhausted. Next shift <t:${Math.floor((now + nextIn) / 1000)}:R>.`,
      );
      return;
    }
    const earned = randInt(50, 250);
    await patchEconomy(interaction.guildId!, interaction.user.id, {
      balance: record.balance + earned,
      workAt: new Date(),
    });
    await interaction.editReply(`🛠️ You earned **${coins(earned)}** ${pick(WORK_JOBS)}.`);
  },
};

function transferCommand(kind: "deposit" | "withdraw"): BotCommand {
  return {
    category: "Economy",
    data: new SlashCommandBuilder()
      .setName(kind)
      .setDescription(`Move coins ${kind === "deposit" ? "into" : "from"} your bank`)
      .addStringOption((o) => o.setName("amount").setDescription("Amount or 'all'").setRequired(true)),
    async execute(interaction) {
      const record = await withEconomy(interaction);
      if (!record) return;
      const source = kind === "deposit" ? record.balance : record.bank;
      const amount = parseAmount(interaction.options.getString("amount", true), source);
      if (amount === null || amount <= 0) {
        await interaction.editReply(
          amount === null ? "Give a positive amount or `all`." : `Not enough in your ${kind === "deposit" ? "wallet" : "bank"}.`,
        );
        return;
      }
      const data =
        kind === "deposit"
          ? { balance: record.balance - amount, bank: record.bank + amount }
          : { balance: record.balance + amount, bank: record.bank - amount };
      await patchEconomy(interaction.guildId!, interaction.user.id, data);
      await interaction.editReply(
        `🏦 Moved **${coins(amount)}** ${kind === "deposit" ? "into" : "from"} your bank.\n` +
          `Wallet: **${coins(data.balance)}** · Bank: **${coins(data.bank)}**`,
      );
    },
  };
}

const payCommand: BotCommand = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("Pay another member")
    .addUserOption((o) => o.setName("user").setDescription("Who receives the coins").setRequired(true))
    .addStringOption((o) => o.setName("amount").setDescription("Amount or 'all'").setRequired(true)),
  async execute(interaction) {
    const target = interaction.options.getUser("user", true);
    if (target.bot || target.id === interaction.user.id) {
      await interaction.deferReply();
      await interaction.editReply("Pick another member (not yourself, not a bot).");
      return;
    }
    const record = await withEconomy(interaction);
    if (!record) return;
    const amount = parseAmount(interaction.options.getString("amount", true), record.balance);
    if (amount === null || amount <= 0) {
      await interaction.editReply(amount === null ? "Give a positive amount or `all`." : "Not enough coins in your wallet.");
      return;
    }
    const targetRecord = await getEconomy(interaction.guildId!, target.id);
    await patchEconomy(interaction.guildId!, interaction.user.id, { balance: record.balance - amount });
    await patchEconomy(interaction.guildId!, target.id, {
      balance: (targetRecord?.balance ?? 0) + amount,
    });
    await interaction.editReply(`💸 You sent **${coins(amount)}** to **${target.username}**.`);
  },
};

const leaderboardCommand: BotCommand = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("The richest members of this server"),
  async execute(interaction) {
    await interaction.deferReply();
    const prisma = getPrisma();
    if (!prisma) {
      await interaction.editReply("Database unavailable.");
      return;
    }
    const rows = await prisma.economy.findMany({
      where: { guildId: interaction.guildId! },
      orderBy: { balance: "desc" },
      take: 10,
    });
    const ranked = [...rows].sort((a, b) => b.balance + b.bank - (a.balance + a.bank)).slice(0, 10);
    const medals = ["🥇", "🥈", "🥉"];
    const lines = ranked.map(
      (row, i) =>
        `${medals[i] ?? `**${i + 1}.**`} <@${row.userId}> — **${coins(row.balance + row.bank)}**`,
    );
    await interaction.editReply({
      embeds: [embed("💰 Richest members", lines.length ? lines.join("\n") : "Nobody has coins yet.")],
    });
  },
};

const shopCommand: BotCommand = {
  category: "Economy",
  data: new SlashCommandBuilder().setName("shop").setDescription("Browse the shop"),
  async execute(interaction) {
    const lines = SHOP.map(
      (item) => `${item.emoji} **${item.name}** — ${coins(item.price)}\n${item.description}`,
    );
    await interaction.reply({
      embeds: [embed("🛒 Shop", `${lines.join("\n\n")}\n\nUse \`/buy item:<name>\`.`)],
    });
  },
};

const buyCommand: BotCommand = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy an item from the shop")
    .addStringOption((o) =>
      o
        .setName("item")
        .setDescription("Item id")
        .setRequired(true)
        .addChoices(...SHOP.map((item) => ({ name: `${item.emoji} ${item.name}`, value: item.id }))),
    ),
  async execute(interaction) {
    const itemId = interaction.options.getString("item", true);
    const item = SHOP.find((entry) => entry.id === itemId);
    if (!item) {
      await interaction.reply({ content: "Unknown item — see /shop." });
      return;
    }
    const record = await withEconomy(interaction);
    if (!record) return;
    if (record.balance < item.price) {
      await interaction.editReply(
        `That costs **${coins(item.price)}** — you only have **${coins(record.balance)}**.`,
      );
      return;
    }
    await patchEconomy(interaction.guildId!, interaction.user.id, {
      balance: record.balance - item.price,
      inventory: [...record.inventory, item.id],
    });
    await interaction.editReply(
      `🛍️ You bought **${item.emoji} ${item.name}** for **${coins(item.price)}**.`,
    );
  },
};

const inventoryCommand: BotCommand = {
  category: "Economy",
  data: new SlashCommandBuilder().setName("inventory").setDescription("Show your items"),
  async execute(interaction) {
    const record = await withEconomy(interaction);
    if (!record) return;
    if (!record.inventory.length) {
      await interaction.editReply("Your inventory is empty. Go shopping with `/shop`.");
      return;
    }
    const counts = new Map<string, number>();
    for (const id of record.inventory) counts.set(id, (counts.get(id) ?? 0) + 1);
    const lines = [...counts.entries()].map(([id, count]) => {
      const item = SHOP.find((entry) => entry.id === id);
      return item ? `${item.emoji} **${item.name}** ×${count}` : `❓ ${id} ×${count}`;
    });
    await interaction.editReply({
      embeds: [embed(`🎒 ${interaction.user.username}'s inventory`, lines.join("\n"))],
    });
  },
};

const gambleCommand: BotCommand = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("gamble")
    .setDescription("Risk your coins on a 45% chance")
    .addStringOption((o) => o.setName("amount").setDescription("Amount or 'all'").setRequired(true)),
  async execute(interaction) {
    const record = await withEconomy(interaction);
    if (!record) return;
    const amount = parseAmount(interaction.options.getString("amount", true), record.balance);
    if (amount === null || amount <= 0) {
      await interaction.editReply(amount === null ? "Give a positive amount or `all`." : "Not enough coins.");
      return;
    }
    if (record.gambleAt && Date.now() - record.gambleAt.getTime() < 5_000) {
      await interaction.editReply("Slow down — 5 seconds between gambles.");
      return;
    }
    const win = Math.random() < 0.45;
    const balance = win ? record.balance + amount : record.balance - amount;
    await patchEconomy(interaction.guildId!, interaction.user.id, {
      balance,
      gambleAt: new Date(),
    });
    await interaction.editReply(
      win
        ? `🎰 **You won ${coins(amount)}!** Balance: **${coins(balance)}**`
        : `💥 **You lost ${coins(amount)}.** Balance: **${coins(balance)}**`,
    );
  },
};

const robCommand: BotCommand = {
  category: "Economy",
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Try to rob another member (risky!)")
    .addUserOption((o) => o.setName("user").setDescription("Target").setRequired(true)),
  async execute(interaction) {
    const target = interaction.options.getUser("user", true);
    if (target.bot || target.id === interaction.user.id) {
      await interaction.deferReply();
      await interaction.editReply("Pick another member.");
      return;
    }
    const record = await withEconomy(interaction);
    if (!record) return;
    if (record.robAt && Date.now() - record.robAt.getTime() < 30 * 60_000) {
      await interaction.editReply("You can rob again in 30 minutes.");
      return;
    }
    const targetRecord = await getEconomy(interaction.guildId!, target.id);
    const targetBalance = targetRecord?.balance ?? 0;
    if (targetBalance < 100) {
      await interaction.editReply(`${target.username} is too poor to rob.`);
      return;
    }
    const success = Math.random() < 0.45;
    if (success) {
      const stolen = randInt(10, Math.min(500, Math.floor(targetBalance / 4)));
      await patchEconomy(interaction.guildId!, interaction.user.id, {
        balance: record.balance + stolen,
        robAt: new Date(),
      });
      await patchEconomy(interaction.guildId!, target.id, {
        balance: targetBalance - stolen,
      });
      await interaction.editReply(
        `🕶️ You stole **${coins(stolen)}** from **${target.username}** and vanished into the night.`,
      );
    } else {
      const fine = randInt(50, Math.min(200, record.balance));
      await patchEconomy(interaction.guildId!, interaction.user.id, {
        balance: record.balance - fine,
        robAt: new Date(),
      });
      if (targetRecord) {
        await patchEconomy(interaction.guildId!, target.id, { balance: targetBalance + fine });
      }
      await interaction.editReply(
        `🚔 You got caught! You paid **${coins(fine)}** to **${target.username}** as a fine.`,
      );
    }
  },
};

export const economyCommands: BotCommand[] = [
  balanceCommand,
  dailyCommand,
  workCommand,
  transferCommand("deposit"),
  transferCommand("withdraw"),
  payCommand,
  leaderboardCommand,
  shopCommand,
  buyCommand,
  inventoryCommand,
  gambleCommand,
  robCommand,
];
