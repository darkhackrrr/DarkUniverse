import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getJson } from "../lib/http";
import type { BotCommand } from "./types";

const ACCENT = 0x8b7cf8;

const AI_KEY = process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY;
const AI_BASE = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
const AI_CHAT_PATH = process.env.AI_CHAT_PATH ?? "/chat/completions";
const AI_MODEL = process.env.AI_MODEL ?? "gpt-4o-mini";
// Optional OpenAI-compatible image override, e.g.
// https://image.pollinations.ai/prompt/{prompt} (GET returns the image directly).
const AI_IMAGE_TEMPLATE = process.env.AI_IMAGE_URL_TEMPLATE;

const NOT_CONFIGURED =
  "AI isn't configured on this bot yet — an admin needs to set `OPENAI_API_KEY` (or `AI_API_KEY`).";

interface ChatResponse {
  choices: { message: { content: string } }[];
}

async function askModel(system: string, prompt: string): Promise<string> {
  const res = await fetch(`${AI_BASE}${AI_CHAT_PATH}`, {
    method: "POST",
    signal: AbortSignal.timeout(30_000),
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${AI_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 800,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI HTTP ${res.status}`);
  const data = (await res.json()) as ChatResponse;
  return data.choices[0]?.message.content.trim() ?? "I got an empty response.";
}

function embed(title: string, description: string) {
  const e = new EmbedBuilder().setColor(ACCENT).setTitle(title);
  if (description) e.setDescription(description.slice(0, 3900));
  return e;
}

function aiPromptCommand(name: string, title: string, system: string, promptLabel: string): BotCommand {
  return {
    category: "AI",
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription(system.slice(0, 96))
      .addStringOption((o) =>
        o.setName("prompt").setDescription(promptLabel).setRequired(true).setMaxLength(1500),
      ),
    async execute(interaction) {
      const prompt = interaction.options.getString("prompt", true);
      await interaction.deferReply();
      if (!AI_KEY) {
        await interaction.editReply(NOT_CONFIGURED);
        return;
      }
      try {
        const answer = await askModel(system, prompt);
        await interaction.editReply({ embeds: [embed(title, answer)] });
      } catch {
        await interaction.editReply("The AI service failed — try again shortly.");
      }
    },
  };
}

const translateCommand: BotCommand = {
  category: "AI",
  data: new SlashCommandBuilder()
    .setName("translate")
    .setDescription("Translate text between languages (auto-detect source)")
    .addStringOption((o) =>
      o.setName("language").setDescription("Target language code (e.g. es, fr, de, ja)").setRequired(true).setMaxLength(10),
    )
    .addStringOption((o) => o.setName("text").setDescription("Text to translate").setRequired(true).setMaxLength(1500)),
  async execute(interaction) {
    const language = interaction.options.getString("language", true).trim().toLowerCase();
    const text = interaction.options.getString("text", true);
    await interaction.deferReply();
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&dt=t&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(language)}`;
      const data = await getJson<unknown[][]>(url);
      const translated = ((data[0] as [string][][]) ?? [])
        .map((segment) => segment[0])
        .join("");
      if (!translated) throw new Error("empty");
      await interaction.editReply({
        embeds: [
          embed("🌐 Translate", `**Original**\n${text.slice(0, 900)}\n\n**${language}**\n${translated.slice(0, 900)}`),
        ],
      });
    } catch {
      await interaction.editReply("Translation failed — check the language code and try again.");
    }
  },
};

const imagineCommand: BotCommand = {
  category: "AI",
  data: new SlashCommandBuilder()
    .setName("imagine")
    .setDescription("Generate an image from a prompt (needs image API)")
    .addStringOption((o) => o.setName("prompt").setDescription("What to draw").setRequired(true).setMaxLength(500)),
  async execute(interaction) {
    const prompt = interaction.options.getString("prompt", true);
    await interaction.deferReply();
    if (!AI_KEY) {
      await interaction.editReply(NOT_CONFIGURED);
      return;
    }
    try {
      if (AI_IMAGE_TEMPLATE) {
        const url = AI_IMAGE_TEMPLATE.replace("{prompt}", encodeURIComponent(prompt));
        const probe = await fetch(url, { method: "GET", signal: AbortSignal.timeout(60_000) });
        if (!probe.ok) throw new Error(`HTTP ${probe.status}`);
        const mime = probe.headers.get("content-type") ?? "";
        if (!mime.startsWith("image/")) throw new Error(`not an image: ${mime}`);
        await probe.body?.cancel().catch(() => null);
        await interaction.editReply({
          embeds: [embed(`🎨 ${prompt.slice(0, 80)}`, "").setImage(url)],
        });
        return;
      }
      const res = await fetch(`${AI_BASE}/images/generations`, {
        method: "POST",
        signal: AbortSignal.timeout(60_000),
        headers: { "content-type": "application/json", authorization: `Bearer ${AI_KEY}` },
        body: JSON.stringify({ model: process.env.AI_IMAGE_MODEL ?? "dall-e-3", prompt, n: 1, size: "1024x1024" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { data: { url?: string; b64_json?: string }[] };
      const image = data.data[0];
      const url = image?.url ?? (image?.b64_json ? `data:image/png;base64,${image.b64_json}` : null);
      if (!url) throw new Error("no image");
      await interaction.editReply({
        embeds: [embed(`🎨 ${prompt.slice(0, 80)}`, "").setImage(url)],
      });
    } catch {
      await interaction.editReply("Image generation failed — the image API may not be configured.");
    }
  },
};

export const aiCommands: BotCommand[] = [
  aiPromptCommand(
    "ai",
    "🤖 AI",
    "You are a helpful, concise assistant inside a Discord server. Keep answers under 600 words and use Discord-friendly formatting.",
    "What do you want to ask?",
  ),
  aiPromptCommand(
    "ask",
    "🤖 Ask",
    "You are a friendly Q&A assistant. Answer accurately and briefly. If unsure, say so.",
    "Your question",
  ),
  aiPromptCommand(
    "summarize",
    "📝 Summary",
    "Summarize the user's text into short bullet points. Capture only the key information.",
    "Text to summarize",
  ),
  aiPromptCommand(
    "explain",
    "📖 Explanation",
    "Explain the topic simply for a Discord audience: short paragraphs, concrete examples, no fluff.",
    "Topic to explain",
  ),
  translateCommand,
  imagineCommand,
];
