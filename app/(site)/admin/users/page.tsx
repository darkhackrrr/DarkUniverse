import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { guardAdmin } from "@/lib/auth/guards";
import { getPrisma } from "@/lib/database/client";
import { isDatabaseConfigured, adminDiscordIds } from "@/lib/config";
import {
  AdminUsersTable,
  type AdminUserRow,
} from "@/components/admin/users-table";

export const metadata: Metadata = {
  title: "Manage users",
  robots: { index: false },
};

export default async function AdminUsersPage() {
  const admin = await guardAdmin("/admin/users");

  let rows: AdminUserRow[] = [];
  const prisma = getPrisma();
  if (prisma) {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { savedTools: true } } },
      });
      rows = users.map((row) => ({
        id: row.id,
        username: row.username,
        name: row.name,
        email: row.email,
        discordId: row.discordId,
        role: row.role,
        points: row.points,
        createdAt: row.createdAt.toISOString(),
        savedTools: row._count.savedTools,
      }));
    } catch {
      rows = [];
    }
  }

  if (rows.length === 0) {
    rows = [
      {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        discordId: admin.discordId,
        role: admin.role,
        points: admin.points,
        createdAt: admin.createdAt,
        savedTools: 0,
      },
    ];
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Roles are enforced server-side — changing a row here updates the
          database role, and the allow-list is checked on every request.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isDatabaseConfigured() && (
          <Alert variant="warning">
            <span className="font-medium">Demo mode.</span> Only your local
            session account exists; role changes and deletions need a database.
          </Alert>
        )}
        <AdminUsersTable
          rows={rows}
          readOnly={!isDatabaseConfigured()}
          selfId={admin.id}
          allowList={adminDiscordIds()}
        />
      </CardContent>
    </Card>
  );
}
