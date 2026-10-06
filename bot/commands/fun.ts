import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { DARES, EIGHT_BALL, JOKES, ROASTS, TRUTHS } from "../lib/content";
import { getJson } from "../lib/http";
import { hashInt, pick, randInt } from "../lib/random";
import type { BotCommand } from "./types";

const ACCENT = 0x8b7cf8;

function embed(title: string, description?: string) {
  const e = new EmbedBuilder().setColor(ACCENT).setTitle(title);
  if (description) e.setDescription(description);
  return e;
}

const eightballCommand: BotCommand = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Ask the magic 8-ball a question")
    .addStringOption((o) => o.setName("question").setDescription("Your question").setRequired(true)),
  async execute(interaction) {
    const question = interaction.options.getString("question", true);
    await interaction.reply({
      embeds: [
        embed("🎱 The 8-ball has spoken").addFields(
          { name: "Question", value: question.slice(0, 1000) },
          { name: "Answer", value: pick(EIGHT_BALL) },
        ),
      ],
    });
  },
};

const coinflipCommand: BotCommand = {
  category: "Fun",
  data: new SlashCommandBuilder().setName("coinflip").setDescription("Flip a coin"),
  async execute(interaction) {
    const result = Math.random() < 0.5 ? "Heads" : "Tails";
    await interaction.reply(`🪙 The coin lands on **${result}**!`);
  },
};

const diceCommand: BotCommand = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("dice")
    .setDescription("Roll a dice")
    .addIntegerOption((o) =>
      o.setName("sides").setDescription("Number of sides (default 6)").setMinValue(2).setMaxValue(1000),
    ),
  async execute(interaction) {
    const sides = interaction.options.getInteger("sides") ?? 6;
    await interaction.reply(`🎲 You rolled a **${randInt(1, sides)}** on a d${sides}!`);
  },
};

const SHIP_VERDICTS = [
  [0, "Please keep this away from the internet."],
  [25, "Doomed, but in a funny way."],
  [45, "Friendzone express."],
  [55, "There might be something there…"],
  [75, "Officially adorable."],
  [90, "Soulmate material."],
  [100, "Tag the wedding photos."],
] as const;

function shipName(a: string, b: string): string {
  const left = a.slice(0, Math.ceil(a.length / 2));
  const right = b.slice(Math.floor(b.length / 2));
  return `${left}${right}`.replace(/\s+/g, "");
}

const shipCommand: BotCommand = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("ship")
    .setDescription("Calculate the love compatibility between two people")
    .addUserOption((o) => o.setName("user1").setDescription("First person").setRequired(true))
    .addUserOption((o) => o.setName("user2").setDescription("Second person").setRequired(true)),
  async execute(interaction) {
    const a = interaction.options.getUser("user1", true);
    const b = interaction.options.getUser("user2", true);
    const pair = [a.id, b.id].sort().join(":");
    const percent = hashInt(pair, 101);
    const verdict =
      SHIP_VERDICTS.filter(([threshold]) => percent >= threshold).pop()?.[1] ??
      SHIP_VERDICTS[0][1];
    const barLength = 12;
    const filled = Math.round((percent / 100) * barLength);
    await interaction.reply({
      embeds: [
        embed(`💘 ${a.username} ❤️ ${b.username}`)
          .setDescription(
            `**${shipName(a.username, b.username)}**\n\n` +
              `\`${"█".repeat(filled)}${"░".repeat(barLength - filled)}\` **${percent}%**\n\n${verdict}`,
          )
          .setThumbnail(a.displayAvatarURL({ size: 128 })),
      ],
    });
  },
};

function roastCommand(): BotCommand {
  return {
    category: "Fun",
    data: new SlashCommandBuilder()
      .setName("roast")
      .setDescription("Roast someone (gently, we promise)")
      .addUserOption((o) => o.setName("user").setDescription("Who deserves it?")),
    async execute(interaction) {
      const target = interaction.options.getUser("user") ?? interaction.user;
      await interaction.reply(`🔥 <@${target.id}>, ${pick(ROASTS)}`);
    },
  };
}

const jokeCommand: BotCommand = {
  category: "Fun",
  data: new SlashCommandBuilder().setName("joke").setDescription("Tell you a joke"),
  async execute(interaction) {
    await interaction.deferReply();
    let joke: string;
    try {
      const data = await getJson<{ joke: string }>("https://icanhazdadjoke.com/", {
        headers: { accept: "application/json" },
      });
      joke = data.joke;
    } catch {
      joke = pick(JOKES);
    }
    await interaction.editReply(`😄 ${joke}`);
  },
};

const memeCommand: BotCommand = {
  category: "Fun",
  data: new SlashCommandBuilder().setName("meme").setDescription("Serve a fresh meme"),
  async execute(interaction) {
    await interaction.deferReply();
    try {
      const data = await getJson<{ title: string; url: string; nsfw: boolean; subreddit: string }>(
        "https://meme-api.com/gimme",
      );
      if (data.nsfw) throw new Error("nsfw");
      await interaction.editReply({
        embeds: [
          embed(data.title.slice(0, 256)).setImage(data.url).setFooter({ text: `r/${data.subreddit}` }),
        ],
      });
    } catch {
      await interaction.editReply(" couldn't fetch a meme right now — try again in a bit.");
    }
  },
};

const rateCommand: BotCommand = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("rate")
    .setDescription("Rate literally anything")
    .addStringOption((o) => o.setName("thing").setDescription("Thing to rate").setRequired(true)),
  async execute(interaction) {
    const thing = interaction.options.getString("thing", true);
    const score = hashInt(thing.trim().toLowerCase(), 101);
    const verdict =
      score === 0
        ? "Absolutely not."
        : score < 30
          ? "Could be worse. Probably shouldn't be, though."
          : score < 60
            ? "Mid, but respectfully."
            : score < 85
              ? "Actually pretty solid."
              : "Certified legend status.";
    await interaction.reply(`📊 I rate **${thing.slice(0, 150)}** a **${score}/100**. ${verdict}`);
  },
};

const ppCommand: BotCommand = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("pp")
    .setDescription("Measure someone's pp. Science.")
    .addUserOption((o) => o.setName("user").setDescription("Volunteer")),
  async execute(interaction) {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const cm = hashInt(target.id, 15) + 1;
    const bars = Math.max(1, Math.round(cm));
    const size =
      cm <= 3 ? "pitiful" : cm <= 6 ? "below average" : cm <= 9 ? "respectable" : cm <= 12 ? "impressive" : "certified monster";
    await interaction.reply({
      embeds: [
        embed(`📏 pp measurement for ${target.username}`)
          .setDescription(`\`${"|".repeat(bars)}\` **${cm} cm** — ${size}`)
          .setFooter({ text: "Peer reviewed by absolutely no one." }),
      ],
    });
  },
};

const chooseCommand: BotCommand = {
  category: "Fun",
  data: new SlashCommandBuilder()
    .setName("choose")
    .setDescription("Let the bot pick between your options")
    .addStringOption((o) =>
      o
        .setName("options")
        .setDescription("Options separated by | (e.g. pizza | burger | sushi)")
        .setRequired(true),
    ),
  async execute(interaction) {
    const options = interaction.options
      .getString("options", true)
      .split(/[|,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
    if (options.length < 2) {
      await interaction.reply({ content: "Give me at least 2 options separated by `|`." });
      return;
    }
    await interaction.reply(`🤔 I choose: **${pick(options)}**`);
  },
};

function promptCommand(name: string, pool: readonly string[]): BotCommand {
  return {
    category: "Fun",
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription(name === "truth" ? "Answer truthfully… if you dare" : "Accept a dare"),
    async execute(interaction) {
      await interaction.reply(`🎲 **${name === "truth" ? "Truth" : "Dare"}:** ${pick(pool)}`);
    },
  };
}

export const funCommands: BotCommand[] = [
  eightballCommand,
  coinflipCommand,
  diceCommand,
  shipCommand,
  roastCommand(),
  jokeCommand,
  memeCommand,
  rateCommand,
  ppCommand,
  chooseCommand,
  promptCommand("truth", TRUTHS),
  promptCommand("dare", DARES),
];
