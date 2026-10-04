import { announceCommand } from "./announce";
import { codesCommand } from "./codes";
import { gamesCommand } from "./games";
import { helpCommand } from "./help";
import { infoCommand } from "./info";
import { verifyCommand } from "./verify";
import type { BotCommand } from "./types";

export const commands: BotCommand[] = [
  gamesCommand,
  codesCommand,
  infoCommand,
  helpCommand,
  verifyCommand,
  announceCommand,
];

export const commandMap: ReadonlyMap<string, BotCommand> = new Map(
  commands.map((command) => [command.data.name, command]),
);
