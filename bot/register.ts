import { REST, Routes } from "discord.js";
import { pathToFileURL } from "node:url";
import { commands } from "./commands";
import { env } from "./env";

export async function registerGuildCommands(): Promise<string[]> {
  const rest = new REST().setToken(env.token);
  const application = (await rest.get(Routes.user())) as { id: string };
  const body = commands.map((command) => command.data.toJSON());
  await rest.put(Routes.applicationGuildCommands(application.id, env.guildId), {
    body,
  });
  return body.map((entry) => entry.name);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  registerGuildCommands()
    .then((names) => console.log(`registered: ${names.join(", ")}`))
    .catch((error) => {
      console.error("registration failed", error);
      process.exit(1);
    });
}
