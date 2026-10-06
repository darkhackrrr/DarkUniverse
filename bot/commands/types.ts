import type {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

export type CommandCategory =
  | "Moderation"
  | "Utility"
  | "Fun"
  | "Economy"
  | "Giveaways"
  | "Server"
  | "Tickets"
  | "Notifications"
  | "AI"
  | "Community"
  | "Site";

export interface BotCommand {
  data: { toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
  category: CommandCategory;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
