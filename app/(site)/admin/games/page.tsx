import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { guardAdmin } from "@/lib/auth/guards";
import { listGames } from "@/lib/content";
import { isDatabaseConfigured } from "@/lib/config";
import { AdminResourceTable } from "@/components/admin/admin-resource-table";
import type { FieldSpec } from "@/components/admin/data-table";

export const metadata: Metadata = {
  title: "Manage games",
  robots: { index: false },
};

const fields: FieldSpec[] = [
  { name: "name", label: "Name", required: true, placeholder: "Troll Tower: Impossible Obby" },
  {
    name: "slug",
    label: "Slug",
    help: "URL key. Defaults to a slugified name when left blank.",
    placeholder: "troll-tower-impossible-obby",
  },
  { name: "description", label: "Description", type: "textarea", required: true },
  { name: "genre", label: "Genre", required: true, placeholder: "Obby" },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: ["Live", "Beta", "Testing", "Development"].map((value) => ({
      value,
      label: value,
    })),
  },
  { name: "players", label: "Catalogue players", type: "number", placeholder: "0" },
  {
    name: "robloxUrl",
    label: "Roblox URL",
    type: "url",
    required: true,
    placeholder: "https://www.roblox.com/games/...",
  },
  {
    name: "universeId",
    label: "Universe ID",
    help: "Used for live player counts and thumbnails.",
    placeholder: "10766699693",
  },
  { name: "thumbUrl", label: "Thumbnail URL", type: "url" },
  { name: "featured", label: "Featured on the home page", type: "checkbox" },
];

export default async function AdminGamesPage() {
  await guardAdmin("/admin/games");
  const games = await listGames();

  const rows = games.map((game) => ({
    id: game.id,
    slug: game.slug,
    name: game.name,
    description: game.description,
    genre: game.genre,
    status: game.status,
    players: game.players,
    robloxUrl: game.robloxUrl,
    universeId: game.universeId ?? "",
    thumbUrl: game.thumbUrl ?? "",
    featured: game.featured ?? false,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Games</CardTitle>
        <CardDescription>
          {games.length} titles. Editing writes to the database and the public
          pages pick the change up immediately.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AdminResourceTable
          resource="games"
          title="Game"
          createLabel="New game"
          rows={rows}
          fields={fields}
          readonly={!isDatabaseConfigured()}
          readonlyNote="No database is configured, so edits are disabled. The catalogue below is the built-in seed data."
        />
      </CardContent>
    </Card>
  );
}
