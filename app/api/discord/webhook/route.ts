import { z } from "zod";
import { readJson, guardRateLimit } from "@/lib/api/guard";
import { badRequest, jsonError, serverError } from "@/lib/api/helpers";

export const runtime = "nodejs";

const payloadSchema = z.object({
  username: z.string().max(80).optional(),
  avatar_url: z
    .string()
    .url()
    .refine((u) => /^https:\/\/(cdn\.discordapp\.com|media\.discordapp\.net|tenor\.com|images\.unsplash\.com)/.test(u), {
      message: "avatar_url must be a Discord CDN, Tenor or Unsplash URL.",
    })
    .optional(),
  content: z.string().max(2000).optional(),
  embeds: z
    .array(
      z.object({
        title: z.string().max(256).optional(),
        description: z.string().max(4096).optional(),
        url: z.string().url().optional(),
        color: z.number().int().min(0).max(0xffffff).optional(),
        timestamp: z.string().optional(),
        footer: z.object({ text: z.string().max(2048) }).optional(),
        author: z.object({ name: z.string().max(256) }).optional(),
        image: z.object({ url: z.string().url() }).optional(),
        thumbnail: z.object({ url: z.string().url() }).optional(),
        fields: z
          .array(
            z.object({
              name: z.string().max(256),
              value: z.string().max(1024),
              inline: z.boolean().optional(),
            }),
          )
          .max(25)
          .optional(),
      }),
    )
    .max(10)
    .optional(),
});

const WEBHOOK_HOSTS = ["discord.com", "discordapp.com", "ptb.discord.com", "canary.discord.com"];

/**
 * POST /api/discord/webhook
 * Server-side proxy so browsers can send a webhook without CORS issues.
 * The target host is strictly allow-listed to prevent SSRF.
 */
export async function POST(request: Request) {
  const limited = guardRateLimit(request, "discord:webhook", 10);
  if (limited) return limited;

  const parsedBody = await readJson(request);
  if ("error" in parsedBody) return parsedBody.error;

  const body = parsedBody.body as { url?: string; payload?: unknown };
  if (!body?.url || typeof body.url !== "string") {
    return badRequest("A webhook url is required.");
  }

  let target: URL;
  try {
    target = new URL(body.url);
  } catch {
    return badRequest("The webhook url is not a valid URL.");
  }

  if (target.protocol !== "https:" || !WEBHOOK_HOSTS.includes(target.hostname)) {
    return jsonError("Webhook URL must be a discord.com HTTPS URL.", 400);
  }
  if (!/\/webhooks\/\d+\/[\w-]+/.test(target.pathname)) {
    return jsonError("URL does not look like a Discord webhook endpoint.", 400);
  }

  const payload = payloadSchema.safeParse(body.payload);
  if (!payload.success) {
    const first = payload.error.issues[0];
    return badRequest(`Invalid payload: ${first?.path.join(".")} — ${first?.message}`);
  }

  const hasContent = Boolean(payload.data.content?.trim()) || (payload.data.embeds?.length ?? 0) > 0;
  if (!hasContent) {
    return badRequest("Provide message content or at least one embed.");
  }

  try {
    const res = await fetch(target.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload.data),
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 204 || res.ok) {
      return Response.json({ ok: true, data: { delivered: true } });
    }
    if (res.status === 404) {
      return jsonError("Webhook not found — it may have been deleted.", 404);
    }
    if (res.status === 429) {
      const retry = (await res.json().catch(() => ({}))) as { retry_after?: number };
      return jsonError(
        `Discord rate limited this webhook. Retry after ${retry.retry_after ?? 5}s.`,
        429,
      );
    }
    return jsonError(`Discord returned HTTP ${res.status}.`, 502);
  } catch {
    return serverError("Could not reach Discord. Check the webhook URL and try again.");
  }
}
