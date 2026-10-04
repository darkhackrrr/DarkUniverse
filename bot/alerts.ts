import type { Client } from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { resolveSendable, type SendableChannel } from "./channels";
import { env } from "./env";
import { pendingAlertEmbed, statusEmbed } from "./embeds";
import { fail, info } from "./log";
import { readState, writeState } from "./state";

const TICK_MS = 60_000;
const UPTIME_EVERY_TICKS = 5;
const PENDING_KEY = "alerts:pending";
const SITE_DOWN_KEY = "alerts:siteDown";

let client: Client | null = null;
let ticks = 0;
let failures = 0;

async function staffChannel(): Promise<SendableChannel | null> {
  if (!client) return null;
  return resolveSendable(client, env.staffChannelId);
}

async function pendingSubmissions(): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;

  const [games, codes] = await Promise.all([
    prisma.gameSubmission.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.codeSubmission.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const current = [
    ...games.map((row) => `g:${row.id}`),
    ...codes.map((row) => `c:${row.id}`),
  ];
  const known = JSON.parse((await readState(PENDING_KEY)) ?? "[]") as string[];
  const fresh = new Set(current.filter((id) => !known.includes(id)));

  if (fresh.size > 0) {
    const entries: { label: string; detail: string }[] = [];
    for (const row of games) {
      if (fresh.has(`g:${row.id}`)) {
        entries.push({
          label: row.name,
          detail: `game · ${row.submitterName || "unknown submitter"}`,
        });
      }
    }
    for (const row of codes) {
      if (fresh.has(`c:${row.id}`)) {
        entries.push({
          label: row.code,
          detail: `code · ${row.submitterName || "unknown submitter"}`,
        });
      }
    }
    const channel = await staffChannel();
    if (channel && entries.length > 0) {
      await channel.send({ embeds: [pendingAlertEmbed(entries)] });
      info("alerts", `notified staff about ${entries.length} pending item(s)`);
    }
  }

  await writeState(PENDING_KEY, JSON.stringify(current));
}

async function uptimeCheck(): Promise<void> {
  const marker = await readState(SITE_DOWN_KEY);
  try {
    const response = await fetch(`${env.siteUrl}/api/health`, {
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`status ${response.status}`);
    failures = 0;
    if (marker === "1") {
      const channel = await staffChannel();
      if (channel) {
        await channel.send({
          embeds: [statusEmbed("recovered", `${env.siteUrl} is reachable again.`)],
        });
      }
      await writeState(SITE_DOWN_KEY, "0");
      info("alerts", "site recovered");
    }
  } catch (error) {
    failures += 1;
    if (failures >= 2 && marker !== "1") {
      const channel = await staffChannel();
      const reason = error instanceof Error ? error.message : String(error);
      if (channel) {
        await channel.send({
          embeds: [statusEmbed("down", `Could not reach ${env.siteUrl} — ${reason}`)],
        });
      }
      await writeState(SITE_DOWN_KEY, "1");
      fail("alerts", `site unreachable: ${reason}`);
    }
  }
}

async function tick(): Promise<void> {
  ticks += 1;
  try {
    await pendingSubmissions();
    if (ticks % UPTIME_EVERY_TICKS === 0) {
      await uptimeCheck();
    }
  } catch (error) {
    fail("alerts", "tick failed", error);
  }
}

export function startAlerts(botClient: Client): void {
  client = botClient;
  void tick();
  const timer = setInterval(() => void tick(), TICK_MS);
  timer.unref?.();
}
