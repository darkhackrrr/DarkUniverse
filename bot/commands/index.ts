import { announceCommand } from "./announce";
import { aiCommands } from "./ai";
import { codesCommand } from "./codes";
import { customCommands } from "./custom";
import { economyCommands } from "./economy";
import { funCommands } from "./fun";
import { gamesCommand } from "./games";
import { giveawayCommands } from "./giveaway";
import { helpCommand } from "./help";
import { infoCommand } from "./info";
import { managementCommands } from "./management";
import { moderationCommands } from "./moderation";
import { notificationCommands } from "./notifications";
import { ticketCommands } from "./ticket";
import { utilityCommands } from "./utility";
import { verifyCommand } from "./verify";
import type { BotCommand } from "./types";

export const commands: BotCommand[] = [
  gamesCommand,
  codesCommand,
  infoCommand,
  helpCommand,
  verifyCommand,
  announceCommand,
  ...moderationCommands,
  ...utilityCommands,
  ...funCommands,
  ...economyCommands,
  ...giveawayCommands,
  ...managementCommands,
  ...ticketCommands,
  ...aiCommands,
  ...notificationCommands,
  ...customCommands,
];

export const commandMap: ReadonlyMap<string, BotCommand> = new Map(
  commands.map((command) => [command.data.toJSON().name, command]),
);
