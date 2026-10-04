import { defineRailway, project, service } from "railway/iac";

// This repository manages only its own resources in the environment. Other
// repositories export their own partial name.
// See https://docs.railway.com/infrastructure-as-code#multi-repo-projects
export const partial = "DarkUniverse";

export default defineRailway(() => {
  const DarkUniverse = service("DarkUniverse", {
    build: "npx prisma generate",
    start: "npm run bot",
    healthcheck: "/healthz",
    healthcheckTimeout: 100,
    // builder from CaC: "NIXPACKS"
  });
  return project("prolific-growth", {
    resources: [DarkUniverse],
  });
});
