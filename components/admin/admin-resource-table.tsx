"use client";

import { Badge } from "@/components/ui/badge";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import {
  AdminDataTable,
  StatusBadge,
  YesNo,
  type AdminRow,
  type ColumnSpec,
  type FieldSpec,
} from "@/components/admin/data-table";

const columnSets: Record<string, ColumnSpec[]> = {
  games: [
    { key: "name", label: "Name" },
    {
      key: "slug",
      label: "Slug",
      render: (row) => <code className="text-xs">{String(row.slug)}</code>,
    },
    { key: "genre", label: "Genre" },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    {
      key: "players",
      label: "Players",
      render: (row) => formatNumber(Number(row.players ?? 0)),
    },
    {
      key: "featured",
      label: "Featured",
      render: (row) => <YesNo value={row.featured} />,
    },
  ],
  codes: [
    {
      key: "code",
      label: "Code",
      render: (row) => (
        <code className="text-xs font-semibold">{String(row.code)}</code>
      ),
    },
    { key: "reward", label: "Reward" },
    { key: "gameName", label: "Game" },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    {
      key: "expiresAt",
      label: "Expires",
      render: (row) => String(row.expiresAt || "—"),
    },
  ],
  resources: [
    { key: "name", label: "Name" },
    {
      key: "category",
      label: "Category",
      render: (row) => <Badge variant="secondary">{String(row.category)}</Badge>,
    },
    {
      key: "description",
      label: "Description",
      render: (row) => (
        <span className="line-clamp-2 text-muted-foreground">
          {String(row.description)}
        </span>
      ),
    },
    {
      key: "tags",
      label: "Tags",
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {String(row.tags || "—")}
        </span>
      ),
    },
    {
      key: "featured",
      label: "Featured",
      render: (row) => <YesNo value={row.featured} />,
    },
  ],
  announcements: [
    { key: "title", label: "Title" },
    {
      key: "category",
      label: "Category",
      render: (row) => <Badge variant="secondary">{String(row.category)}</Badge>,
    },
    {
      key: "slug",
      label: "Slug",
      render: (row) => <code className="text-xs">{String(row.slug)}</code>,
    },
    {
      key: "publishedAt",
      label: "Published",
      render: (row) => (
        <span className="text-muted-foreground">
          {formatRelativeTime(String(row.publishedAt))}
        </span>
      ),
    },
  ],
  rewards: [
    { key: "name", label: "Name" },
    {
      key: "type",
      label: "Type",
      render: (row) => <Badge variant="outline">{String(row.type)}</Badge>,
    },
    { key: "points", label: "Points" },
    { key: "active", label: "Active", render: (row) => <YesNo value={row.active} /> },
  ],
  tools: [
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    {
      key: "slug",
      label: "Slug",
      render: (row) => <code className="text-xs">{String(row.slug)}</code>,
    },
    {
      key: "href",
      label: "URL",
      render: (row) => (
        <code className="text-xs text-muted-foreground">{String(row.href)}</code>
      ),
    },
  ],
};

export type AdminResource = keyof typeof columnSets;

interface Props {
  resource: AdminResource;
  title: string;
  createLabel: string;
  rows: AdminRow[];
  fields: FieldSpec[];
  readonly?: boolean;
  readonlyNote?: string;
}

export function AdminResourceTable({
  resource,
  title,
  createLabel,
  rows,
  fields,
  readonly,
  readonlyNote,
}: Props) {
  return (
    <AdminDataTable
      resource={resource}
      title={title}
      createLabel={createLabel}
      rows={rows}
      fields={fields}
      columns={columnSets[resource]}
      readonly={readonly}
      readonlyNote={readonlyNote}
    />
  );
}
