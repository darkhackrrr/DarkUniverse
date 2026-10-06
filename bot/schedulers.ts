import type { Client } from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { endGiveaway } from "./commands/giveaway";
import { fail, info } from "./log";
import { runSubscriptionTick } from "./lib/subscriptions";

const TICK_MS = 15_000;
const SUBSCRIPTION_TICK_MS = 5 * 60_000;

function tally(votes: Record<string, number> | null, optionCount: number): number[] {
  const counts = Array.from({ length: optionCount }, () => 0);
  if (!votes) return counts;
  for (const value of Object.values(votes)) {
    if (Number.isInteger(value) && value >= 0 && value < optionCount) counts[value] += 1;
  }
  return counts;
}

function bar(count: number, max: number, length = 12): string {
  const filled = max > 0 ? Math.round((count / max) * length) : 0;
  return "▓".repeat(filled) + "░".repeat(length - filled);
}

async function tickGiveaways(client: Client): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const due = await prisma.giveaway.findMany({
    where: { ended: false, endsAt: { lte: new Date() } },
    take: 10,
  });
  for (const giveaway of due) {
    await endGiveaway(client, giveaway);
    info("giveaway", `ended "${giveaway.prize}" (id ${giveaway.id})`);
  }
}

async function tickReminders(client: Client): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const due = await prisma.reminder.findMany({
    where: { done: false, remindAt: { lte: new Date() } },
    take: 10,
  });
  for (const reminder of due) {
    await prisma.reminder.update({ where: { id: reminder.id }, data: { done: true } });
    try {
      const channel = await client.channels.fetch(reminder.channelId);
      if (channel && "send" in channel) {
        await (channel as { send: (o: object) => Promise<unknown> }).send({
          content: `⏰ <@${reminder.userId}> reminder: **${reminder.message.slice(0, 250)}**`,
        });
      } else {
        const user = await client.users.fetch(reminder.userId).catch(() => null);
        await user?.send(`⏰ Reminder: **${reminder.message.slice(0, 250)}**`).catch(() => null);
      }
    } catch (error) {
      fail("reminders", `reminder ${reminder.id} failed`, error);
    }
  }
}

async function tickPolls(client: Client): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const due = await prisma.poll.findMany({
    where: { ended: false, endsAt: { lte: new Date() } },
    take: 10,
  });
  for (const poll of due) {
    try {
      const votes = (poll.votes as Record<string, number> | null) ?? {};
      const counts = tally(votes, poll.options.length);
      const max = Math.max(...counts, 1);
      const total = Object.keys(votes).length;
      const winnerIndex = counts.indexOf(Math.max(...counts));
      const lines = poll.options.map(
        (label, index) =>
          `**${index + 1}.** ${label}\n\`${bar(counts[index], max)}\` **${counts[index]}** vote${counts[index] === 1 ? "" : "s"}`,
      );
      const winner =
        total > 0
          ? `\n\n🏆 **Winner:** ${poll.options[winnerIndex]} (${counts[winnerIndex]} vote${counts[winnerIndex] === 1 ? "" : "s"})`
          : "\n\nNo votes were cast.";
      await prisma.poll.update({ where: { id: poll.id }, data: { ended: true } });
      const channel = await client.channels.fetch(poll.channelId).catch(() => null);
      if (channel && "messages" in channel) {
        const message = await (channel as { messages: { fetch: (id: string) => Promise<{ edit: (o: object) => Promise<unknown> }> } })
          .messages.fetch(poll.messageId)
          .catch(() => null);
        if (message) {
          const { EmbedBuilder } = await import("discord.js");
          await message.edit({
            embeds: [
              new EmbedBuilder()
                .setColor(0x8b7cf8)
                .setTitle(`📊 ${poll.question} — poll ended`)
                .setDescription(lines.join("\n") + winner)
                .setFooter({ text: `${total} total vote${total === 1 ? "" : "s"}` }),
            ],
            components: [],
          });
        }
      }
      info("poll", `ended poll ${poll.id} with ${total} vote(s)`);
    } catch (error) {
      fail("polls", `poll ${poll.id} failed`, error);
    }
  }
}

async function tickSubscriptions(client: Client): Promise<void> {
  try {
    const posted = await runSubscriptionTick(client);
    if (posted > 0) info("subscriptions", `posted ${posted} update(s)`);
  } catch (error) {
    fail("subscriptions", "tick failed", error);
  }
}

export function startSchedulers(client: Client): void {
  const tick = () => {
    void tickGiveaways(client).catch((error) => fail("giveaways", "tick failed", error));
    void tickReminders(client).catch((error) => fail("reminders", "tick failed", error));
    void tickPolls(client).catch((error) => fail("polls", "tick failed", error));
  };
  void tick();
  setInterval(tick, TICK_MS).unref?.();
  setInterval(() => void tickSubscriptions(client), SUBSCRIPTION_TICK_MS).unref?.();
  info("schedulers", "giveaway, reminder, poll and subscription schedulers started");
}
