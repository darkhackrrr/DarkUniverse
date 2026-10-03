import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { guardAdmin } from "@/lib/auth/guards";
import { listCodes, listGames } from "@/lib/content";
import { isDatabaseConfigured } from "@/lib/config";
import { AdminResourceTable } from "@/components/admin/admin-resource-table";
import type { FieldSpec } from "@/components/admin/data-table";

export const metadata: Metadata = {
  title: "Manage codes",
  robots: { index: false },
};

export default async function AdminCodesPage() {
  await guardAdmin("/admin/codes");
  const [codes, games] = await Promise.all([listCodes(), listGames()]);

  const fields: FieldSpec[] = [
    { name: "code", label: "Code", required: true, placeholder: "WELCOME2026" },
    { name: "reward", label: "Reward", required: true, placeholder: "500 Coins" },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: ["active", "expired", "upcoming"].map((value) => ({
        value,
        label: value,
      })),
    },
    {
      name: "expiresAt",
      label: "Expires at",
      type: "text",
      placeholder: "2026-12-31",
      help: "ISO date, leave blank for no expiry.",
    },
    {
      name: "gameId",
      label: "Game",
      type: "select",
      options: games.map((game) => ({ value: game.id, label: game.name })),
      help: "Optional — links the code to a game.",
    },
  ];

  const rows = codes.map((code) => ({
    id: code.id,
    code: code.code,
    reward: code.reward,
    status: code.status,
    expiresAt: code.expiresAt ?? "",
    gameId: code.gameId ?? "",
    gameName: code.gameName ?? "—",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game codes</CardTitle>
        <CardDescription>
          {codes.length} codes across the catalogue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdminResourceTable
          resource="codes"
          title="Code"
          createLabel="New code"
          rows={rows}
          fields={fields}
          readonly={!isDatabaseConfigured()}
          readonlyNote="No database is configured, so edits are disabled. The table below is the built-in seed data."
        />
      </CardContent>
    </Card>
  );
}
