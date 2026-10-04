import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

function loadLocalEnv(): void {
  const file = resolve(process.cwd(), ".env");
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadLocalEnv();

const schema = z.object({
  DISCORD_BOT_TOKEN: z.string().min(1, "required"),
  GUILD_ID: z.string().regex(/^\d{17,20}$/, "must be a snowflake"),
  FEED_CHANNEL_ID: z.string().regex(/^\d{17,20}$/, "must be a snowflake"),
  STAFF_CHANNEL_ID: z.string().regex(/^\d{17,20}$/, "must be a snowflake"),
  VERIFY_ROLE_ID: z.string().regex(/^\d{17,20}$/, "must be a snowflake"),
  ADMIN_ROLE_ID: z.string().regex(/^\d{17,20}$/, "must be a snowflake"),
  ADMIN_DISCORD_IDS: z.string().default(""),
  SITE_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.string().default("production"),
});

const result = schema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Bot configuration invalid:\n${details}`);
}

export const env = {
  token: result.data.DISCORD_BOT_TOKEN,
  guildId: result.data.GUILD_ID,
  feedChannelId: result.data.FEED_CHANNEL_ID,
  staffChannelId: result.data.STAFF_CHANNEL_ID,
  verifyRoleId: result.data.VERIFY_ROLE_ID,
  adminRoleId: result.data.ADMIN_ROLE_ID,
  adminDiscordIds: result.data.ADMIN_DISCORD_IDS.split(",")
    .map((id) => id.trim())
    .filter(Boolean),
  siteUrl: result.data.SITE_URL.replace(/\/$/, ""),
  databaseUrl: result.data.DATABASE_URL,
  port: result.data.PORT,
  nodeEnv: result.data.NODE_ENV,
};
