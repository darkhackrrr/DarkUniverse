"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
  Search,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";

export type FieldValue = string | boolean | number;

export interface FieldSpec {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "number" | "checkbox" | "url";
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  placeholder?: string;
  help?: string;
}

export interface ColumnSpec {
  key: string;
  label: string;
  render?: (row: Record<string, FieldValue>) => React.ReactNode;
}

export interface AdminRow extends Record<string, FieldValue> {
  id: string;
}

interface Props {
  resource: string;
  title: string;
  createLabel: string;
  rows: AdminRow[];
  fields: FieldSpec[];
  columns: ColumnSpec[];
  readonly?: boolean;
  readonlyNote?: string;
}

function emptyValues(fields: FieldSpec[]): Record<string, FieldValue> {
  return Object.fromEntries(
    fields.map((field) => [field.name, field.type === "checkbox" ? false : ""]),
  );
}

export function AdminDataTable({
  resource,
  title,
  createLabel,
  rows,
  fields,
  columns,
  readonly = false,
  readonlyNote,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminRow | null>(null);
  const [values, setValues] = React.useState<Record<string, FieldValue>>(
    emptyValues(fields),
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "").toLowerCase().includes(q),
      ),
    );
  }, [rows, query]);

  const startCreate = () => {
    setEditing(null);
    setValues(emptyValues(fields));
    setError(null);
    setOpen(true);
  };

  const startEdit = (row: AdminRow) => {
    setEditing(row);
    const next = emptyValues(fields);
    for (const field of fields) {
      const raw = row[field.name];
      next[field.name] =
        field.type === "checkbox" ? Boolean(raw) : (raw ?? "");
    }
    setValues(next);
    setError(null);
    setOpen(true);
  };

  const submit = async () => {
    for (const field of fields) {
      if (field.required && !String(values[field.name] ?? "").trim()) {
        setError(`${field.label} is required.`);
        return;
      }
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${resource}`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing?.id, ...values }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? "Save failed.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/${resource}?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) setError(json?.error ?? "Delete failed.");
      else router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      {readonly && readonlyNote && (
        <Alert variant="warning">
          <span className="font-medium">Read-only.</span> {readonlyNote}
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}…`}
            className="pl-9"
          />
        </div>
        {!readonly && (
          <Button onClick={startCreate}>
            <Plus /> {createLabel}
          </Button>
        )}
      </div>

      {error && !open && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface">
            <tr className="border-b border-border text-left text-[0.7rem] uppercase tracking-wide text-muted-foreground">
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium">
                  {column.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No rows match your search.
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 align-top">
                    {column.render
                      ? column.render(row)
                      : String(row[column.key] ?? "—")}
                  </td>
                ))}
                <td className="px-4 py-3 text-right align-top">
                  <div className="inline-flex gap-1">
                    {!readonly && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(row)}
                          aria-label="Edit"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove(row.id)}
                          disabled={deleting === row.id}
                          aria-label="Delete"
                        >
                          {deleting === row.id ? (
                            <Loader2 className="animate-spin" />
                          ) : (
                            <Trash2 />
                          )}
                        </Button>
                      </>
                    )}
                    {readonly && <Lock className="mt-1 size-4 text-muted-foreground" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title}` : createLabel}</DialogTitle>
            <DialogDescription>
              Saved through the admin API — the public pages read this data back
              on the next request.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            {fields.map((field) => {
              const id = `field-${field.name}`;
              const value = values[field.name];
              return (
                <div
                  key={field.name}
                  className={field.type === "textarea" ? "sm:col-span-2" : undefined}
                >
                  <Label htmlFor={id}>
                    {field.label}
                    {field.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={id}
                      value={String(value ?? "")}
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className="mt-1.5 min-h-28"
                    />
                  ) : field.type === "checkbox" ? (
                    <label
                      htmlFor={id}
                      className="mt-1.5 flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        id={id}
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) =>
                          setValues((prev) => ({
                            ...prev,
                            [field.name]: e.target.checked,
                          }))
                        }
                        className="size-4 rounded border-border accent-[var(--color-primary)]"
                      />
                      {field.placeholder ?? "Enabled"}
                    </label>
                  ) : field.type === "select" ? (
                    <select
                      id={id}
                      value={String(value ?? "")}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className="mt-1.5 flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    >
                      <option value="">Select…</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={id}
                      type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                      value={String(value ?? "")}
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      className="mt-1.5"
                    />
                  )}
                  {field.help && (
                    <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              <X /> Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Save />}
              {editing ? "Save changes" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StatusBadge({ value }: { value: FieldValue }) {
  const text = String(value ?? "");
  const tone =
    text === "active" || text === "Live"
      ? "success"
      : text === "expired" || text === "Development"
        ? "secondary"
        : "warning";
  return <Badge variant={tone}>{text || "—"}</Badge>;
}

export function YesNo({ value }: { value: FieldValue }) {
  return (
    <Badge variant={value ? "default" : "secondary"}>{value ? "Yes" : "No"}</Badge>
  );
}

export function AdminLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-primary underline-offset-4 hover:underline">
      {label}
    </Link>
  );
}
