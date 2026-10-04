import { createServer } from "node:http";
import { env } from "./env";
import { info } from "./log";

export function startHealthServer(): void {
  const started = Date.now();
  const server = createServer((_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      JSON.stringify({
        ok: true,
        service: "darkuniverse-bot",
        uptimeSeconds: Math.round((Date.now() - started) / 1000),
        time: new Date().toISOString(),
      }),
    );
  });

  server.listen(env.port, () => {
    info("health", `listening on port ${env.port}`);
  });
  server.on("error", (error) => {
    process.exitCode = 1;
    console.error("[health] failed to bind", error);
  });
}
