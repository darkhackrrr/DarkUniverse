import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { startAlerts } from "./alerts";
import { commandMap } from "./commands";
import { env } from "./env";
import { startFeed } from "./feed";
import { startHealthServer } from "./health";
import { fail, info } from "./log";
import { registerGuildCommands } from "./register";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once(Events.ClientReady, async (ready) => {
  info("bot", `logged in as ${ready.user.tag}`);
  try {
    const names = await registerGuildCommands();
    info("bot", `registered commands: ${names.join(", ")}`);
  } catch (error) {
    fail("bot", "command registration failed", error);
  }
  startHealthServer();
  startFeed(client);
  startAlerts(client);
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
    const prisma = getPrisma();
    if (!prisma) return;
    const user = await prisma.user.findUnique({ where: { discordId: member.id } });
    if (user?.isBotVerified) {
      await member.roles.add(env.verifyRoleId);
      info("members", `restored Verified role for ${member.user.tag}`);
    }
  } catch (error) {
    fail("members", "role grant failed", error);
  }
});

client.login(env.token).catch((error) => {
  console.error(
    "[bot] login failed — verify DISCORD_BOT_TOKEN and that the Server Members Intent is enabled in the Discord portal.",
    error,
  );
  process.exit(1);
});
