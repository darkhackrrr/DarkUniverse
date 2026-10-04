import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { getPrisma } from "@/lib/database/client";
import { env } from "../env";
import type { BotCommand } from "./types";

export const verifyCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Link your DarkUniverse Hub account and get the Verified role")
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("The verification code from your dashboard")
        .setRequired(true),
    ),
  async execute(interaction) {
    const reply = async (content: string) => {
      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    };

    const prisma = getPrisma();
    if (!prisma) {
      await reply("Verification needs a configured database — it is unavailable.");
      return;
    }

    const code = interaction.options.getString("code", true).trim().toUpperCase();
    const user = await prisma.user.findUnique({ where: { verifyCode: code } });
    if (!user || !user.verifyExpiresAt || user.verifyExpiresAt.getTime() < Date.now()) {
      await reply("That code is invalid or expired. Generate a fresh one on your dashboard.");
      return;
    }
    if (user.discordId && user.discordId !== interaction.user.id) {
      await reply("That code belongs to a different Discord account.");
      return;
    }
    if (!interaction.guild) {
      await reply("Run this inside the DarkUniverse Studios server.");
      return;
    }

    const member = await interaction.guild.members
      .fetch(interaction.user.id)
      .catch(() => null);
    if (!member) {
      await reply("Could not fetch your server member record — try again.");
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verifyCode: null,
        verifyExpiresAt: null,
        isBotVerified: true,
        discordId: user.discordId ?? interaction.user.id,
      },
    });

    const granted: string[] = [];
    if (!member.roles.cache.has(env.verifyRoleId)) {
      await member.roles.add(env.verifyRoleId);
      granted.push("Verified");
    }
    if (
      env.adminDiscordIds.includes(interaction.user.id) &&
      !member.roles.cache.has(env.adminRoleId)
    ) {
      await member.roles.add(env.adminRoleId);
      granted.push("Admin");
    }

    await reply(
      `Verified as **${user.username}** on DarkUniverse Hub. ` +
        (granted.length
          ? `Roles granted: ${granted.join(", ")}.`
          : "You already had the roles."),
    );
  },
};
