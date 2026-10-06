import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
} from "discord.js";
import { startAlerts } from "./alerts";
import { commandMap } from "./commands";
import { env } from "./env";
import { startFeed } from "./feed";
import { startHealthServer } from "./health";
import { registerListeners } from "./listeners";
import { fail, info } from "./log";
import { registerGuildCommands } from "./register";
import { startSchedulers } from "./schedulers";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

client.once(Events.ClientReady, async (ready) => {
  info("bot", `logged in as ${ready.user.tag}`);
  try {
    const names = await registerGuildCommands();
    info("bot", `registered ${names.length} commands: ${names.join(", ")}`);
  } catch (error) {
    fail("bot", "command registration failed", error);
  }
  startHealthServer();
  startFeed(client);
  startAlerts(client);
  registerListeners(client);
  startSchedulers(client);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commandMap.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    fail("commands", `/${interaction.commandName} failed`, error);
    const content = "Something went wrong running that command.";
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content, flags: MessageFlags.Ephemeral });
      }
    } catch {
      return;
    }
  }
});

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    if (env.adminDiscordIds.includes(member.id)) {
      await member.roles.add(env.adminRoleId);
      info("members", `granted Admin to ${member.user.tag}`);
    }
  } catch (error) {
    fail("members", "role grant failed", error);
  }
});

client.login(env.token).catch((error) => {
  console.error(
    "[bot] login failed — verify DISCORD_BOT_TOKEN, the Server Members Intent, and the Message Content Intent are enabled in the Discord portal.",
    error,
  );
  process.exit(1);
});
