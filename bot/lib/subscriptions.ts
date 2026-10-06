import type { Client, TextChannel } from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { getJson, getText } from "./http";
import type { Subscription } from "@prisma/client";

const CACHE_TTL = 10 * 60_000;
const idCache = new Map<string, { id: string; expiresAt: number }>();

function cacheKey(type: string, target: string) {
  return `${type}:${target.toLowerCase()}`;
}

function remember(type: string, target: string, id: string): string {
  idCache.set(cacheKey(type, target), { id, expiresAt: Date.now() + CACHE_TTL });
  return id;
}

function recall(type: string, target: string): string | null {
  const hit = idCache.get(cacheKey(type, target));
  return hit && hit.expiresAt > Date.now() ? hit.id : null;
}

export async function resolveYouTubeChannelId(input: string): Promise<string | null> {
  const direct = input.trim().match(/^(UC[\w-]{22})$/);
  if (direct) return remember("youtube", input, direct[1]);
  const urlMatch = input.match(/youtube\.com\/channel\/(UC[\w-]{22})/);
  if (urlMatch) return remember("youtube", input, urlMatch[1]);
  const cached = recall("youtube", input);
  if (cached) return cached;
  const handle = input.trim().replace(/^https?:\/\/(www\.)?youtube\.com\//, "").replace(/\/+$/, "");
  if (!handle) return null;
  try {
    const html = await getText(`https://www.youtube.com/${handle}`, { timeoutMs: 10_000 });
    const match = html.match(/"channelId":"(UC[\w-]{22})"/);
    if (match) return remember("youtube", input, match[1]);
  } catch {
    return null;
  }
  return null;
}

export interface FeedItem {
  id: string;
  title: string;
  url: string;
}

export async function fetchYouTubeLatest(channelId: string): Promise<FeedItem | null> {
  try {
    const xml = await getText(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { timeoutMs: 10_000 },
    );
    const entry = xml.match(/<entry>[\s\S]*?<\/entry>/);
    if (!entry) return null;
    const block = entry[0];
    const id = block.match(/<id>yt:video:([\w-]+)<\/id>/)?.[1] ?? null;
    const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "New video";
    const url =
      block.match(/<link rel="alternate" href="([^"]+)"/)?.[1] ??
      (id ? `https://www.youtube.com/watch?v=${id}` : null);
    if (!id || !url) return null;
    return { id, title: decodeEntities(title).slice(0, 200), url };
  } catch {
    return null;
  }
}

function decodeEntities(text: string): string {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

export async function resolveRobloxUser(input: string): Promise<{ id: string; name: string } | null> {
  const direct = input.trim().match(/^(\d{4,12})$/);
  if (direct) {
    try {
      const user = await getJson<{ name: string }>(
        `https://users.roblox.com/v1/users/${direct[1]}`,
      );
      return { id: direct[1], name: user.name };
    } catch {
      return null;
    }
  }
  try {
    const search = await getJson<{ data: { id: number; name: string }[] }>(
      `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(input.trim())}&limit=10`,
    );
    const exact =
      search.data.find((u) => u.name.toLowerCase() === input.trim().toLowerCase()) ?? search.data[0];
    return exact ? { id: String(exact.id), name: exact.name } : null;
  } catch {
    return null;
  }
}

export async function fetchLatestBadge(userId: string): Promise<FeedItem | null> {
  try {
    const data = await getJson<{ data: { id: number; name: string }[] }>(
      `https://badges.roblox.com/v1/users/${userId}/badges?limit=10&sortOrder=Desc`,
    );
    const badge = data.data[0];
    if (!badge) return null;
    return {
      id: String(badge.id),
      title: badge.name,
      url: `https://www.roblox.com/users/${userId}/profile`,
    };
  } catch {
    return null;
  }
}

// --- Twitch (needs TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET) ---

let twitchToken: { value: string; expiresAt: number } | null = null;

export function twitchConfigured(): boolean {
  return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
}

export function twitterConfigured(): boolean {
  return Boolean(process.env.TWITTER_BEARER_TOKEN);
}

async function twitchAppToken(): Promise<string | null> {
  if (twitchToken && twitchToken.expiresAt > Date.now()) return twitchToken.value;
  if (!twitchConfigured()) return null;
  try {
    const data = await getJson<{ access_token: string; expires_in: number }>(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
      { method: "POST" },
    );
    twitchToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return twitchToken.value;
  } catch {
    return null;
  }
}

export async function resolveTwitchUser(login: string): Promise<string | null> {
  const token = await twitchAppToken();
  if (!token) return null;
  try {
    const data = await getJson<{ data: { id: string }[] }>(
      `https://api.twitch.tv/helix/users?login=${encodeURIComponent(login.trim().toLowerCase())}`,
      { headers: { "client-id": process.env.TWITCH_CLIENT_ID!, authorization: `Bearer ${token}` } },
    );
    return data.data[0]?.id ?? null;
  } catch {
    return null;
  }
}

export interface LiveStream {
  id: string;
  title: string;
  game: string;
  url: string;
}

export async function fetchTwitchLive(userId: string, login: string): Promise<LiveStream | null> {
  const token = await twitchAppToken();
  if (!token) return null;
  try {
    const data = await getJson<{ data: { id: string; title: string; game_name: string }[] }>(
      `https://api.twitch.tv/helix/streams?user_id=${userId}`,
      { headers: { "client-id": process.env.TWITCH_CLIENT_ID!, authorization: `Bearer ${token}` } },
    );
    const stream = data.data[0];
    if (!stream) return null;
    return {
      id: stream.id,
      title: stream.title.slice(0, 200) || "LIVE",
      game: stream.game_name,
      url: `https://twitch.tv/${login}`,
    };
  } catch {
    return null;
  }
}

// --- Twitter / X (needs TWITTER_BEARER_TOKEN) ---

export async function resolveTwitterUser(handle: string): Promise<string | null> {
  if (!twitterConfigured()) return null;
  try {
    const data = await getJson<{ data: { id: string } }>(
      `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle.replace(/^@/, "").trim())}`,
      { headers: { authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` } },
    );
    return data.data?.id ?? null;
  } catch {
    return null;
  }
}

export async function fetchLatestTweet(userId: string): Promise<FeedItem | null> {
  if (!twitterConfigured()) return null;
  try {
    const data = await getJson<{ data: { id: string; text: string }[] }>(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=5&exclude=replies,retweets`,
      { headers: { authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` } },
    );
    const tweet = data.data?.[0];
    if (!tweet) return null;
    return {
      id: tweet.id,
      title: tweet.text.slice(0, 250),
      url: `https://x.com/i/status/${tweet.id}`,
    };
  } catch {
    return null;
  }
}

// --- Poller ---

export async function runSubscriptionTick(client: Client): Promise<number> {
  const prisma = getPrisma();
  if (!prisma) return 0;
  const subs = await prisma.subscription.findMany({
    where: { enabled: true, type: { in: ["youtube", "roblox", "twitch", "twitter"] } },
    take: 40,
  });
  let posted = 0;
  for (const sub of subs) {
    try {
      const item = await fetchForSubscription(sub);
      if (!item) continue;
      if (item.id === sub.lastSeen) continue;
      const isFirst = !sub.lastSeen;
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { lastSeen: item.id },
      });
      if (isFirst) continue; // baseline — don't announce old posts
      const channel = await client.channels.fetch(sub.channelId).catch(() => null);
      if (!channel || !("send" in channel)) continue;
      const mention = sub.roleId ? { content: `<@&${sub.roleId}>` } : {};
      await (channel as TextChannel).send({
        ...mention,
        allowedMentions: sub.roleId ? { roles: [sub.roleId] } : { parse: [] },
        embeds: [
          {
            title: titleFor(sub.type, item.title),
            url: item.url,
            color: 0x8b7cf8,
            description: item.title,
            footer: { text: labelFor(sub.type, sub.target) },
          },
        ],
      });
      posted += 1;
    } catch {
      // one broken subscription must not stop the tick
    }
  }
  return posted;
}

async function fetchForSubscription(sub: Subscription): Promise<FeedItem | null> {
  if (sub.type === "youtube") {
    const channelId = sub.targetId ?? (await resolveYouTubeChannelId(sub.target));
    if (!channelId) return null;
    return fetchYouTubeLatest(channelId);
  }
  if (sub.type === "roblox") {
    const userId = sub.targetId ?? (await resolveRobloxUser(sub.target))?.id;
    if (!userId) return null;
    return fetchLatestBadge(userId);
  }
  if (sub.type === "twitch") {
    if (!twitchConfigured() || !sub.targetId) return null;
    return fetchTwitchLive(sub.targetId, sub.target);
  }
  if (sub.type === "twitter") {
    if (!twitterConfigured() || !sub.targetId) return null;
    return fetchLatestTweet(sub.targetId);
  }
  return null;
}

function titleFor(type: string, title: string): string {
  if (type === "youtube") return `📺 New video: ${title.slice(0, 80)}`;
  if (type === "roblox") return `🟥 New Roblox badge: ${title.slice(0, 80)}`;
  if (type === "twitch") return `🟣 Now live: ${title.slice(0, 80)}`;
  return `🐦 New post from ${title.slice(0, 80)}`;
}

function labelFor(type: string, target: string): string {
  const labels: Record<string, string> = {
    youtube: `YouTube · ${target}`,
    roblox: `Roblox · ${target}`,
    twitch: `Twitch · ${target}`,
    twitter: `X · ${target}`,
  };
  return labels[type] ?? target;
}
