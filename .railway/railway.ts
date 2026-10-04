import { defineRailway, project, service, github, preserve } from "railway/iac";

// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "DarkUniverse";

export default defineRailway(() => {
  const DarkUniverse = service("DarkUniverse", {
    source: github("darkhackrrr/DarkUniverse", { branch: "main" }),
    build: "npx prisma generate",
    start: "npm run bot",
    healthcheck: "/healthz",
    healthcheckTimeout: 100,
    variables: {
      DISCORD_BOT_TOKEN: preserve(),
      GUILD_ID: preserve(),
      FEED_CHANNEL_ID: preserve(),
      STAFF_CHANNEL_ID: preserve(),
      VERIFY_ROLE_ID: preserve(),
      ADMIN_ROLE_ID: preserve(),
      ADMIN_DISCORD_IDS: preserve(),
      DATABASE_URL: preserve(),
      SITE_URL: preserve(),
    },
  });
  return project("prolific-growth", {
    resources: [DarkUniverse],
  });
});
