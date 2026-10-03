"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Users,
  Clock,
  Activity,
  ExternalLink,
  UserCheck,
  ThumbsUp,
  ThumbsDown,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ToolShell,
  Field,
  Panel,
  InfoCard,
  CopyButton,
  KeyValue,
  EmptyRow,
  apiGet,
} from "@/components/tools/tool-shell";
import { formatDate, formatNumber, formatRelativeTime } from "@/lib/utils";

/* --------------------------------------------------------------- shared */

function useLookup<T>() {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const run = React.useCallback(
    async (url: string) => {
      setLoading(true);
      setError(null);
      const res = await apiGet<T>(url);
      if (res.ok) setData(res.data);
      else {
        setData(null);
        setError(res.error);
      }
      setLoading(false);
    },
    [],
  );

  const reset = React.useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, error, loading, run, reset };
}

function SearchForm({
  placeholder,
  label = "Roblox username, user ID or profile URL",
  onSubmit,
  loading,
}: {
  placeholder: string;
  label?: string;
  onSubmit: (value: string) => void;
  loading: boolean;
}) {
  const [value, setValue] = React.useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim();
        if (v) onSubmit(v);
      }}
      className="space-y-3"
    >
      <Field label={label} htmlFor="roblox-input">
        <Input
          id="roblox-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
      </Field>
      <Button type="submit" disabled={loading || !value.trim()}>
        <Search />
        {loading ? "Looking up…" : "Look up"}
      </Button>
    </form>
  );
}

function ErrorAlert({ error }: { error: string }) {
  return (
    <Alert variant="destructive">
      <span className="font-medium">Lookup failed.</span> {error}
    </Alert>
  );
}

function Lines({ urls, alt }: { urls: string[]; alt: string }) {
  const [failed, setFailed] = React.useState<Record<string, boolean>>({});
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {urls.map((url, i) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group overflow-hidden rounded-lg border border-border bg-surface"
          title="Open full size"
        >
          {failed[url] ? (
            <div className="grid aspect-video place-items-center text-xs text-muted-foreground">
              Image unavailable
            </div>
          ) : (
             
            <img
              src={url}
              alt={`${alt} ${i + 1}`}
              loading="lazy"
              onError={() => setFailed((f) => ({ ...f, [url]: true }))}
              className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          )}
        </a>
      ))}
    </div>
  );
}

/* -------------------------------------------------------- profile lookup */

interface ProfileData {
  profile: {
    id: number;
    name: string;
    displayName: string;
    about: string;
    created: string;
    isBanned: boolean;
    hasVerifiedBadge: boolean;
  };
  avatarUrl: string | null;
  headshotUrl: string | null;
  history?: Array<{ name: string; created: string }>;
  historyNote?: string | null;
}

export function RobloxProfileLookup() {
  const { data, error, loading, run } = useLookup<ProfileData>();

  return (
    <ToolShell
      title="Look up any public Roblox profile"
      description="Enter a username, a numeric user ID or paste a profile URL."
      aside={
        <InfoCard>
          Data comes straight from Roblox&apos;s public users and thumbnail APIs
          and is cached for two minutes. Private profiles and banned accounts
          are returned as-is.
        </InfoCard>
      }
    >
      <Panel>
        <SearchForm
          placeholder="e.g. Roblox, 1, or roblox.com/users/1/profile"
          onSubmit={(v) => run(`/api/roblox/user?user=${encodeURIComponent(v)}`)}
          loading={loading}
        />
      </Panel>

      {loading && (
        <Panel>
          <div className="flex items-center gap-4">
            <Skeleton className="size-20 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </Panel>
      )}

      {error && <ErrorAlert error={error} />}

      {data && (
        <Panel
          title={data.profile.displayName}
          description={`@${data.profile.name} · Roblox user #${data.profile.id}`}
          actions={
            <div className="flex gap-2">
              <CopyButton value={String(data.profile.id)} label="Copy ID" />
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`https://www.roblox.com/users/${data.profile.id}/profile`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink /> Profile
                </a>
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="relative size-32 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
              {data.avatarUrl && (
                 
                <img
                  src={data.avatarUrl}
                  alt={`${data.profile.displayName} avatar`}
                  className="size-full object-contain"
                />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap gap-2">
                {data.profile.hasVerifiedBadge && (
                  <Badge variant="info">Verified</Badge>
                )}
                {data.profile.isBanned ? (
                  <Badge variant="destructive">Banned</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                {data.profile.about?.trim() ||
                  "This user hasn't written an about section."}
              </p>
              <KeyValue
                items={[
                  { label: "Joined", value: formatDate(data.profile.created) },
                  {
                    label: "User ID",
                    value: data.profile.id,
                    mono: true,
                  },
                  {
                    label: "Account age",
                    value: `${Math.max(
                      1,
                      Math.round(
                        (Date.now() - new Date(data.profile.created).getTime()) /
                          86_400_000,
                      ),
                    )} days`,
                  },
                  {
                    label: "Profile URL",
                    value: `roblox.com/users/${data.profile.id}/profile`,
                    mono: true,
                  },
                ]}
              />
            </div>
          </div>

          {data.history && data.history.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Previous usernames</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Used since</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.history.map((h) => (
                    <TableRow key={`${h.name}-${h.created}`}>
                      <TableCell className="font-mono">{h.name}</TableCell>
                      <TableCell>{formatDate(h.created)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {data.historyNote && (
            <p className="text-xs text-muted-foreground">{data.historyNote}</p>
          )}
        </Panel>
      )}
    </ToolShell>
  );
}

/* --------------------------------------------------------- avatar viewer */

interface AvatarData {
  userId: number;
  avatarUrl: string | null;
  headshotUrl: string | null;
  assets?: Array<{ id: number; name: string; type: string }>;
  outfits?: Array<{ id: number; name: string; edited: string; thumbnail: string | null }>;
}

export function RobloxAvatarViewer() {
  const { data, error, loading, run } = useLookup<AvatarData>();

  return (
    <ToolShell
      title="Full-resolution avatar render"
      description="Fetches the current avatar render plus every equipped asset."
      aside={
        <InfoCard>
          Renders are requested at 720×720 from Roblox&apos;s thumbnail service
          — the highest publicly available size.
        </InfoCard>
      }
    >
      <Panel>
        <SearchForm
          placeholder="Username, user ID or profile URL"
          onSubmit={(v) => run(`/api/roblox/avatar?username=${encodeURIComponent(v)}`)}
          loading={loading}
        />
      </Panel>

      {loading && (
        <Panel>
          <Skeleton className="aspect-square w-full max-w-xs rounded-lg" />
        </Panel>
      )}
      {error && <ErrorAlert error={error} />}

      {data && (
        <Panel
          title="Avatar"
          description={`User #${data.userId}`}
          actions={
            <div className="flex gap-2">
              {data.avatarUrl && <CopyButton value={data.avatarUrl} label="Copy image URL" />}
              {data.avatarUrl && (
                <Button size="sm" variant="outline" asChild>
                  <a href={data.avatarUrl} target="_blank" rel="noopener noreferrer" download>
                    <Download /> Open
                  </a>
                </Button>
              )}
            </div>
          }
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Full body</p>
              <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
                {data.avatarUrl ? (
                   
                  <img src={data.avatarUrl} alt="Avatar render" className="w-full object-contain" />
                ) : (
                  <EmptyRow label="No render available for this user." />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Headshot</p>
              <div className="relative overflow-hidden rounded-lg border border-border bg-surface">
                {data.headshotUrl ? (
                   
                  <img src={data.headshotUrl} alt="Headshot render" className="w-full object-contain" />
                ) : (
                  <EmptyRow label="No headshot available." />
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">
              Equipped assets{" "}
              {data.assets ? <span className="text-muted-foreground">({data.assets.length})</span> : null}
            </h3>
            {data.assets && data.assets.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.assets.map((asset) => (
                  <a
                    key={asset.id}
                    href={`https://www.roblox.com/catalog/${asset.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs transition-colors hover:border-primary/40"
                  >
                    <span className="text-muted-foreground">{asset.type}</span>
                    <span className="font-medium group-hover:text-foreground">{asset.name}</span>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyRow label="No equipped asset data returned." />
            )}
          </div>
        </Panel>
      )}
    </ToolShell>
  );
}

/* -------------------------------------------------------- user id lookup */

export function RobloxUserIdLookup() {
  const { data, error, loading, run } = useLookup<ProfileData>();
  const [mode, setMode] = React.useState<"id" | "username">("id");

  return (
    <ToolShell
      title="Convert between usernames and user IDs"
      description="Roblox usernames can change — the numeric ID is the only stable identifier."
      aside={
        <InfoCard>
          Username lookups use Roblox&apos;s batch username endpoint, so
          misspelt names return a clear “not found” instead of a wrong account.
        </InfoCard>
      }
    >
      <Panel>
        <div className="mb-4 flex gap-2">
          <Button
            size="sm"
            variant={mode === "id" ? "default" : "outline"}
            onClick={() => setMode("id")}
          >
            Username → ID
          </Button>
          <Button
            size="sm"
            variant={mode === "username" ? "default" : "outline"}
            onClick={() => setMode("username")}
          >
            ID → Username
          </Button>
        </div>
        <SearchForm
          label={mode === "id" ? "Roblox username" : "Roblox user ID"}
          placeholder={mode === "id" ? "e.g. builderman" : "e.g. 1"}
          onSubmit={(v) =>
            run(
              mode === "id"
                ? `/api/roblox/user?username=${encodeURIComponent(v)}`
                : `/api/roblox/user?id=${encodeURIComponent(v)}`,
            )
          }
          loading={loading}
        />
      </Panel>

      {loading && (
        <Panel>
          <Skeleton className="h-24 w-full" />
        </Panel>
      )}
      {error && <ErrorAlert error={error} />}

      {data && (
        <Panel title="Result">
          <KeyValue
            items={[
              { label: "Username", value: data.profile.name, mono: true },
              { label: "Display name", value: data.profile.displayName },
              { label: "User ID", value: data.profile.id, mono: true },
              { label: "Joined", value: formatDate(data.profile.created) },
              {
                label: "Profile URL",
                value: `https://www.roblox.com/users/${data.profile.id}/profile`,
                mono: true,
              },
              {
                label: "API URL",
                value: `https://users.roblox.com/v1/users/${data.profile.id}`,
                mono: true,
              },
            ]}
          />
          <div className="flex flex-wrap gap-2">
            <CopyButton value={String(data.profile.id)} label="Copy ID" />
            <CopyButton value={data.profile.name} label="Copy username" />
            <CopyButton
              value={`https://www.roblox.com/users/${data.profile.id}/profile`}
              label="Copy profile URL"
            />
          </div>
        </Panel>
      )}
    </ToolShell>
  );
}

/* --------------------------------------------------------- group lookup */

interface GroupData {
  group: {
    id: number;
    name: string;
    description: string;
    owner: { userId: number; username: string; displayName: string } | null;
    shout: { body: string; poster?: { username: string } } | null;
    memberCount: number;
    publicEntryAllowed: boolean;
    hasVerifiedBadge: boolean;
  };
  iconUrl: string | null;
}

export function RobloxGroupLookup() {
  const { data, error, loading, run } = useLookup<GroupData>();

  return (
    <ToolShell
      title="Inspect a Roblox group"
      description="Member count, owner, current shout and group description."
      aside={<InfoCard>Accepts a group ID or a full group URL.</InfoCard>}
    >
      <Panel>
        <SearchForm
          label="Group ID or group URL"
          placeholder="e.g. 1200769 or roblox.com/groups/1200769/…"
          onSubmit={(v) => run(`/api/roblox/group?id=${encodeURIComponent(v)}`)}
          loading={loading}
        />
      </Panel>

      {loading && (
        <Panel>
          <Skeleton className="h-32 w-full" />
        </Panel>
      )}
      {error && <ErrorAlert error={error} />}

      {data && (
        <Panel
          title={data.group.name}
          description={`Group #${data.group.id}`}
          actions={
            <div className="flex gap-2">
              <CopyButton value={String(data.group.id)} label="Copy ID" />
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`https://www.roblox.com/groups/${data.group.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink /> Open
                </a>
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
              {data.iconUrl && (
                 
                <img src={data.iconUrl} alt={`${data.group.name} icon`} className="size-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {data.group.description || "No group description."}
              </p>
              <KeyValue
                items={[
                  {
                    label: "Members",
                    value: (
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5 text-muted-foreground" />
                        {formatNumber(data.group.memberCount)}
                      </span>
                    ),
                  },
                  {
                    label: "Owner",
                    value: data.group.owner
                      ? `${data.group.owner.displayName} (@${data.group.owner.username})`
                      : "None / audit",
                  },
                  {
                    label: "Join policy",
                    value: data.group.publicEntryAllowed ? "Open entry" : "Approval required",
                  },
                  {
                    label: "Verified",
                    value: data.group.hasVerifiedBadge ? "Yes" : "No",
                  },
                ]}
              />
            </div>
          </div>

          {data.group.shout && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-primary">Current shout</p>
              <p className="mt-1 text-sm">
                {data.group.shout.body}
                {data.group.shout.poster && (
                  <span className="text-muted-foreground">
                    {" "}
                    — {data.group.shout.poster.username}
                  </span>
                )}
              </p>
            </div>
          )}
        </Panel>
      )}
    </ToolShell>
  );
}

/* ---------------------------------------------------------- game lookup */

interface GameData {
  game: {
    id: number;
    rootPlaceId: number;
    name: string;
    description: string;
    creator: { id: number; name: string; type: string; hasVerifiedBadge?: boolean };
    playing: number;
    visits: number;
    favoritedCount?: number;
    maxPlayers: number;
    created: string;
    updated: string;
    genre: string;
  };
  placeId: number;
  universeId: number;
  votes: { up: number; down: number; ratio: number } | null;
  thumbnailUrl?: string | null;
}

export function RobloxGameLookup() {
  const { data, error, loading, run } = useLookup<GameData>();

  return (
    <ToolShell
      title="Live game details"
      description="Place ID, universe ID or a full game URL — resolves automatically."
      aside={
        <InfoCard>
          Stats are read live from Roblox&apos;s games, votes and thumbnail
          APIs, so the playing count is what the site shows right now.
        </InfoCard>
      }
    >
      <Panel>
        <SearchForm
          label="Place ID, universe ID or game URL"
          placeholder="e.g. 1234567890 or roblox.com/games/1234567890/…"
          onSubmit={(v) => run(`/api/roblox/game?id=${encodeURIComponent(v)}`)}
          loading={loading}
        />
      </Panel>

      {loading && (
        <Panel>
          <Skeleton className="h-40 w-full" />
        </Panel>
      )}
      {error && <ErrorAlert error={error} />}

      {data && (
        <Panel
          title={data.game.name}
          description={`by ${data.game.creator.name} · ${data.game.genre || "Unlisted genre"}`}
          actions={
            <div className="flex gap-2">
              <CopyButton value={String(data.universeId)} label="Copy universe ID" />
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`https://www.roblox.com/games/${data.placeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink /> Play
                </a>
              </Button>
            </div>
          }
        >
          <div className="grid gap-5 md:grid-cols-[240px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              {data.thumbnailUrl ? (
                 
                <img
                  src={data.thumbnailUrl}
                  alt={`${data.game.name} thumbnail`}
                  className="aspect-video w-full object-cover md:aspect-auto md:h-full"
                />
              ) : (
                <div className="grid aspect-video place-items-center text-xs text-muted-foreground">
                  No thumbnail
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {data.game.description || "No description provided."}
              </p>
              <KeyValue
                items={[
                  {
                    label: "Playing now",
                    value: (
                      <span className="inline-flex items-center gap-1.5 text-success">
                        <Activity className="size-3.5" />
                        {formatNumber(data.game.playing)}
                      </span>
                    ),
                  },
                  { label: "Visits", value: formatNumber(data.game.visits) },
                  {
                    label: "Favorites",
                    value: data.game.favoritedCount
                      ? formatNumber(data.game.favoritedCount)
                      : "—",
                  },
                  { label: "Max players", value: data.game.maxPlayers },
                  { label: "Place ID", value: data.placeId, mono: true },
                  { label: "Universe ID", value: data.universeId, mono: true },
                  { label: "Updated", value: formatRelativeTime(data.game.updated) },
                  { label: "Created", value: formatDate(data.game.created) },
                ]}
              />
              {data.votes && (
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-success transition-all"
                      style={{ width: `${data.votes.ratio}%` }}
                    />
                  </div>
                  <span className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="size-3.5 text-success" />
                      {formatNumber(data.votes.up)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ThumbsDown className="size-3.5 text-destructive" />
                      {formatNumber(data.votes.down)}
                    </span>
                    <span className="font-medium text-foreground">{data.votes.ratio}%</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}
    </ToolShell>
  );
}

/* ------------------------------------------------------ thumbnail viewer */

interface MediaData {
  urls: string[];
}

function MediaTool({
  title,
  description,
  label,
  placeholder,
  endpoint,
  hint,
}: {
  title: string;
  description: string;
  label: string;
  placeholder: string;
  endpoint: (value: string) => string;
  hint: React.ReactNode;
}) {
  const { data, error, loading, run } = useLookup<MediaData>();
  const [value, setValue] = React.useState("");

  return (
    <ToolShell title={title} description={description} aside={<InfoCard>{hint}</InfoCard>}>
      <Panel>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) run(endpoint(value.trim()));
          }}
          className="space-y-3"
        >
          <Field label={label} htmlFor="media-input">
            <Input
              id="media-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
            />
          </Field>
          <Button type="submit" disabled={loading || !value.trim()}>
            <Search />
            {loading ? "Fetching…" : "Fetch image"}
          </Button>
        </form>
      </Panel>

      {loading && <Skeleton className="h-56 w-full" />}
      {error && <ErrorAlert error={error} />}

      {data && (
        <Panel
          title="Images"
          description={`${data.urls.length} image${data.urls.length === 1 ? "" : "s"} found`}
          actions={
            <div className="flex gap-2">
              <CopyButton value={data.urls[0] ?? ""} label="Copy first URL" />
              {data.urls[0] && (
                <Button size="sm" variant="outline" asChild>
                  <a href={data.urls[0]} target="_blank" rel="noopener noreferrer">
                    <Download /> Open full size
                  </a>
                </Button>
              )}
            </div>
          }
        >
          <Lines urls={data.urls} alt="Roblox image" />
        </Panel>
      )}
    </ToolShell>
  );
}

export function RobloxGameThumbnailViewer() {
  return (
    <MediaTool
      title="Browse every game thumbnail"
      description="Pulls up to 8 thumbnails for an experience at full resolution."
      label="Place ID, universe ID or game URL"
      placeholder="e.g. 1234567890"
      endpoint={(v) => `/api/roblox/media?type=game-thumbnails&id=${encodeURIComponent(v)}`}
      hint="Thumbnails are returned at 768×432 and open at full size in a new tab."
    />
  );
}

export function RobloxGameIconViewer() {
  return (
    <MediaTool
      title="Fetch a game icon"
      description="Returns the square icon artwork used in Roblox's browse pages."
      label="Place ID"
      placeholder="e.g. 1234567890"
      endpoint={(v) => `/api/roblox/media?type=game-icon&id=${encodeURIComponent(v)}`}
      hint="Icons are requested at 512×512 PNG."
    />
  );
}

export function RobloxGroupIconViewer() {
  return (
    <MediaTool
      title="Preview a group icon"
      description="Fetches the uploaded icon of any Roblox group at maximum size."
      label="Group ID or group URL"
      placeholder="e.g. 1200769"
      endpoint={(v) => `/api/roblox/media?type=group-icon&id=${encodeURIComponent(v)}`}
      hint="Group icons are requested at 420×420 PNG — the largest public size."
    />
  );
}

/* ------------------------------------------------------- presence lookup */

interface PresenceData {
  userId: number;
  presenceType: number;
  label: string;
  lastLocation: string;
  placeId: number | null;
  universeId: number | null;
  gameId: string | null;
  lastOnline: string | null;
}

export function RobloxPresenceLookup() {
  const { data, error, loading, run } = useLookup<PresenceData>();

  const online = data ? data.presenceType !== 0 : false;

  return (
    <ToolShell
      title="Check who's online"
      description="Shows whether a user is offline, on the website, in Studio or in a game."
      aside={
        <InfoCard>
          Presence data is polled live from Roblox&apos;s presence endpoint and
          cached for 30 seconds — Roblox itself only updates it periodically.
        </InfoCard>
      }
    >
      <Panel>
        <SearchForm
          placeholder="Username, user ID or profile URL"
          onSubmit={(v) => run(`/api/roblox/presence?username=${encodeURIComponent(v)}`)}
          loading={loading}
        />
      </Panel>

      {loading && <Skeleton className="h-32 w-full" />}
      {error && <ErrorAlert error={error} />}

      {data && (
        <Panel
          title="Presence"
          description={`User #${data.userId}`}
          actions={
            <Badge variant={online ? "success" : "secondary"}>
              <span
                className={`size-1.5 rounded-full ${online ? "bg-success" : "bg-muted-foreground"}`}
              />
              {online ? "Online" : "Offline"}
            </Badge>
          }
        >
          <KeyValue
            items={[
              { label: "Status", value: data.label },
              {
                label: "Location",
                value: data.lastLocation || (online ? "Online" : "—"),
              },
              {
                label: "Place ID",
                value: data.placeId ?? "—",
                mono: Boolean(data.placeId),
              },
              {
                label: "Universe ID",
                value: data.universeId ?? "—",
                mono: Boolean(data.universeId),
              },
              {
                label: "Last online",
                value: data.lastOnline ? formatRelativeTime(data.lastOnline) : "Unknown",
              },
            ]}
          />
          {data.placeId ? (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://www.roblox.com/games/${data.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink /> Open current game
              </a>
            </Button>
          ) : null}
        </Panel>
      )}
    </ToolShell>
  );
}

/* --------------------------------------------------------- server status */

interface StatusData {
  checkedAt: string;
  status: "operational" | "degraded" | "outage";
  operational: number;
  total: number;
  avgLatency: number;
  services: Array<{
    name: string;
    url: string;
    ok: boolean;
    status: number;
    latencyMs: number;
    error: string | null;
  }>;
}

export function RobloxServerStatus() {
  const { data, error, loading, run } = useLookup<StatusData>();

  React.useEffect(() => {
    run("/api/roblox/status");
  }, [run]);

  return (
    <ToolShell
      title="Roblox platform health"
      description="Live probes against Roblox's public APIs — we measure latency from our server on every check."
      aside={
        <InfoCard>
          Instead of trusting a third-party status page, this tool actually
          calls Roblox endpoints and reports HTTP status plus round-trip time.
          Refresh to re-probe.
        </InfoCard>
      }
    >
      <Panel
        actions={
          <Button size="sm" variant="outline" onClick={() => run("/api/roblox/status")} disabled={loading}>
            <Clock className={loading ? "animate-spin" : ""} /> Re-check
          </Button>
        }
      >
        {loading && !data && (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {error && <ErrorAlert error={error} />}

        {data && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    data.status === "operational"
                      ? "success"
                      : data.status === "degraded"
                        ? "warning"
                        : "destructive"
                  }
                >
                  {data.status === "operational"
                    ? "All systems operational"
                    : data.status === "degraded"
                      ? "Degraded performance"
                      : "Outage detected"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {data.operational}/{data.total} endpoints healthy ·{" "}
                  {data.avgLatency}ms average
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Checked {formatRelativeTime(data.checkedAt)}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.services.map((service) => (
                  <TableRow key={service.url}>
                    <TableCell>
                      <a
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary"
                      >
                        {service.name}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.ok ? "success" : "destructive"}>
                        {service.ok ? `HTTP ${service.status}` : service.error}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {service.latencyMs}ms
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </ToolShell>
  );
}

/* ------------------------------------------------------ username lookup */

export function RobloxUsernameLookup() {
  const { data, error, loading, run } = useLookup<ProfileData>();
  const [historyOn, setHistoryOn] = React.useState(true);

  return (
    <ToolShell
      title="Resolve a Roblox username"
      description="Confirms the current owner of a username and, where Roblox allows it, the account's previous names."
      aside={
        <InfoCard>
          Roblox only exposes name history for accounts that permit it — when a
          403 comes back we tell you instead of showing invented entries.
        </InfoCard>
      }
    >
      <Panel>
        <div className="mb-4 flex items-center gap-2 text-sm">
          <input
            id="history-toggle"
            type="checkbox"
            checked={historyOn}
            onChange={(e) => setHistoryOn(e.target.checked)}
            className="size-4 accent-[var(--color-primary)]"
          />
          <label htmlFor="history-toggle" className="text-muted-foreground">
            Also fetch previous usernames
          </label>
        </div>
        <SearchForm
          label="Roblox username"
          placeholder="e.g. Roblox"
          onSubmit={(v) =>
            run(
              `/api/roblox/user?username=${encodeURIComponent(v)}${historyOn ? "&history=1" : ""}`,
            )
          }
          loading={loading}
        />
      </Panel>

      {loading && <Skeleton className="h-32 w-full" />}
      {error && <ErrorAlert error={error} />}

      {data && (
        <Panel
          title={data.profile.name}
          description={`Display name: ${data.profile.displayName}`}
          actions={<CopyButton value={String(data.profile.id)} label="Copy ID" />}
        >
          <KeyValue
            items={[
              { label: "Username", value: data.profile.name, mono: true },
              { label: "User ID", value: data.profile.id, mono: true },
              { label: "Joined", value: formatDate(data.profile.created) },
              { label: "Verified badge", value: data.profile.hasVerifiedBadge ? "Yes" : "No" },
              { label: "Banned", value: data.profile.isBanned ? "Yes" : "No" },
              {
                label: "Canonical URL",
                value: `https://www.roblox.com/users/${data.profile.id}/profile`,
                mono: true,
              },
            ]}
          />

          {historyOn && (
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <UserCheck className="size-4 text-primary" /> Name history
              </h3>
              {data.history && data.history.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>In use since</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.history.map((h) => (
                      <TableRow key={`${h.name}-${h.created}`}>
                        <TableCell className="font-mono">{h.name}</TableCell>
                        <TableCell>{formatDate(h.created)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyRow label={data.historyNote ?? "No history available."} />
              )}
            </div>
          )}
        </Panel>
      )}
    </ToolShell>
  );
}

/* --------------------------------------------------------- outfit viewer */

interface OutfitData {
  userId: number;
  avatarUrl: string | null;
  headshotUrl: string | null;
  outfits: Array<{ id: number; name: string; edited: string; thumbnail: string | null }>;
}

export function RobloxOutfitViewer() {
  const { data, error, loading, run } = useLookup<OutfitData>();

  return (
    <ToolShell
      title="Browse saved outfits"
      description="Lists every saved outfit for a user with a preview render of each."
      aside={
        <InfoCard>
          Outfits are public unless the account has restricted them — a private
          closet returns an empty list rather than an error.
        </InfoCard>
      }
    >
      <Panel>
        <SearchForm
          placeholder="Username, user ID or profile URL"
          onSubmit={(v) => run(`/api/roblox/avatar?username=${encodeURIComponent(v)}&outfits=1`)}
          loading={loading}
        />
      </Panel>

      {loading && (
        <Panel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </Panel>
      )}
      {error && <ErrorAlert error={error} />}

      {data && (
        <Panel
          title={`Outfits for user #${data.userId}`}
          description={`${data.outfits.length} saved outfit${data.outfits.length === 1 ? "" : "s"}`}
        >
          {data.outfits.length === 0 ? (
            <EmptyRow label="This user has no saved outfits, or their closet is private." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {data.outfits.map((outfit) => (
                <div
                  key={outfit.id}
                  className="overflow-hidden rounded-lg border border-border bg-surface"
                >
                  <div className="aspect-square">
                    {outfit.thumbnail ? (
                       
                      <img
                        src={outfit.thumbnail}
                        alt={outfit.name}
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="grid size-full place-items-center text-xs text-muted-foreground">
                        No preview
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium">{outfit.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Edited {formatDate(outfit.edited)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </ToolShell>
  );
}

export function ToolsLinkRow() {
  return (
    <p className="text-sm text-muted-foreground">
      Want more?{" "}
      <Link href="/tools" className="text-primary hover:underline">
        Back to all tools
      </Link>
      .
    </p>
  );
}
