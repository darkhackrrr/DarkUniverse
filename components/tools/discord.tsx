"use client";

import * as React from "react";
import {
  Search,
  Clock,
  Copy,
  Plus,
  Trash2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  ToolShell,
  Field,
  Panel,
  InfoCard,
  CopyButton,
  KeyValue,
  useCopy,
  apiGet,
} from "@/components/tools/tool-shell";
import {
  timestampStyles,
  buildToken,
  format as formatTimestamp,
  type TimestampStyle,
} from "@/lib/discord/timestamp";
import {
  normalizeHex,
  hexToRgb,
  rgbToHex,
  rgbToInt,
  intToRgb,
  rgbToHsl,
  hslToRgb,
  discordPalette,
} from "@/lib/discord/color";
import { decodeSnowflake } from "@/lib/discord/snowflake";
import { formatDate, formatRelativeTime } from "@/lib/utils";

/* ---------------------------------------------------- timestamp generator */

export function DiscordTimestampGenerator() {
  const [mode, setMode] = React.useState<"datetime" | "now">("datetime");
  const [local, setLocal] = React.useState(() => {
    const d = new Date();
    d.setSeconds(0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [customStyle, setCustomStyle] = React.useState<TimestampStyle>("f");
  const [token, setToken] = React.useState("");

  const seconds = React.useMemo(() => {
    if (mode === "now") return Math.floor(Date.now() / 1000);
    const parsed = new Date(local);
    return Number.isNaN(parsed.getTime()) ? 0 : Math.floor(parsed.getTime() / 1000);
  }, [mode, local]);

  const valid = seconds > 0;

  return (
    <ToolShell
      title="Discord timestamp tokens"
      description="Pick a moment, then copy any <t:…> token. Each member sees it in their own timezone."
      aside={
        <InfoCard>
          Paste the token into any message, embed description or channel
          topic. Style <code className="font-mono">R</code> is relative and
          updates continuously (“in 3 hours”).
        </InfoCard>
      }
    >
      <Panel>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === "datetime" ? "default" : "outline"}
            onClick={() => setMode("datetime")}
          >
            Pick a date & time
          </Button>
          <Button
            size="sm"
            variant={mode === "now" ? "default" : "outline"}
            onClick={() => setMode("now")}
          >
            <Clock /> Right now
          </Button>
        </div>

        {mode === "datetime" && (
          <Field label="Local date & time" htmlFor="ts-input">
            <Input
              id="ts-input"
              type="datetime-local"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
            />
          </Field>
        )}

        <Field label="Preview style" htmlFor="ts-style">
          <select
            id="ts-style"
            value={customStyle}
            onChange={(e) => setCustomStyle(e.target.value as TimestampStyle)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {timestampStyles.map((s) => (
              <option key={s.style} value={s.style}>
                {s.label} ({s.style})
              </option>
            ))}
          </select>
        </Field>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            readOnly
            value={valid ? buildToken(seconds, customStyle) : ""}
            className="max-w-xs font-mono"
            aria-label="Generated token"
          />
          <CopyButton value={valid ? buildToken(seconds, customStyle) : ""} label="Copy token" />
        </div>

        <Field label="Or set a custom token" hint="Edits apply to the table below">
          <div className="flex gap-2">
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="<t:1735689600:f>"
              className="font-mono"
            />
            <CopyButton value={token} label="Copy custom" />
          </div>
        </Field>
      </Panel>

      <Panel title="Every style" description="Copy the token or the rendered text.">
        {!valid ? (
          <p className="text-sm text-muted-foreground">Choose a valid date first.</p>
        ) : (
          <div className="space-y-2">
            {timestampStyles.map((s) => {
              const value = token.trim() || buildToken(seconds, s.style);
              return (
                <div
                  key={s.style}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatTimestamp(seconds, s.style)} · <span className="font-mono">{value}</span>
                    </p>
                  </div>
                  <CopyButton value={value} label="Copy" />
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </ToolShell>
  );
}

/* ---------------------------------------------------------- embed builder */

interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

interface EmbedState {
  title: string;
  description: string;
  url: string;
  color: string;
  author: string;
  authorIcon: string;
  footer: string;
  thumbnail: string;
  image: string;
  timestamp: boolean;
  fields: EmbedField[];
}

const emptyEmbed: EmbedState = {
  title: "",
  description: "",
  url: "",
  color: "7C6CF5",
  author: "",
  authorIcon: "",
  footer: "",
  thumbnail: "",
  image: "",
  timestamp: false,
  fields: [],
};

export function DiscordEmbedBuilder() {
  const [embed, setEmbed] = React.useState<EmbedState>(emptyEmbed);
  const [content, setContent] = React.useState("");
  const { copied, copy } = useCopy();

  const set = <K extends keyof EmbedState>(key: K, value: EmbedState[K]) =>
    setEmbed((e) => ({ ...e, [key]: value }));

  const payload = React.useMemo(() => {
    const out: Record<string, unknown> = {};
    if (content.trim()) out.content = content;
    const e: Record<string, unknown> = {};
    if (embed.title) e.title = embed.title;
    if (embed.description) e.description = embed.description;
    if (embed.url) e.url = embed.url;
    const hex = normalizeHex(embed.color);
    if (hex) e.color = parseInt(hex, 16);
    if (embed.author) {
      e.author = { name: embed.author, ...(embed.authorIcon ? { icon_url: embed.authorIcon } : {}) };
    }
    if (embed.thumbnail) e.thumbnail = { url: embed.thumbnail };
    if (embed.image) e.image = { url: embed.image };
    if (embed.footer) e.footer = { text: embed.footer };
    if (embed.timestamp) e.timestamp = new Date().toISOString();
    if (embed.fields.length > 0) {
      e.fields = embed.fields
        .filter((f) => f.name.trim() && f.value.trim())
        .map((f) => ({ name: f.name, value: f.value, inline: f.inline }));
    }
    if (Object.keys(e).length > 0) out.embeds = [e];
    return out;
  }, [content, embed]);

  const json = JSON.stringify(payload, null, 2);

  const addField = () =>
    setEmbed((e) => ({
      ...e,
      fields: [...e.fields, { name: "", value: "", inline: true }],
    }));

  return (
    <ToolShell
      title="Design a rich embed"
      description="Edit on the left, watch the Discord-accurate preview on the right, copy the JSON."
      aside={
        <InfoCard>
          Output is a webhook payload:{" "}
          <code className="font-mono">{"{ content, embeds: [...] }"}</code>.
          Post it with the Webhook Message Builder or straight from your bot.
        </InfoCard>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Panel title="Message">
            <Field label="Content (message text)" htmlFor="embed-content">
              <Textarea
                id="embed-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Optional text shown above the embed"
                rows={3}
                maxLength={2000}
              />
              <p className="text-right text-xs text-muted-foreground">{content.length}/2000</p>
            </Field>
          </Panel>

          <Panel title="Embed body">
            <Field label="Title" htmlFor="embed-title">
              <Input
                id="embed-title"
                value={embed.title}
                onChange={(e) => set("title", e.target.value)}
                maxLength={256}
                placeholder="Big bold headline"
              />
            </Field>
            <Field label="Title URL" htmlFor="embed-url">
              <Input
                id="embed-url"
                value={embed.url}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Description" htmlFor="embed-desc">
              <Textarea
                id="embed-desc"
                value={embed.description}
                onChange={(e) => set("description", e.target.value)}
                rows={4}
                maxLength={4096}
                placeholder="Supports **markdown**, `code`, [links](https://discord.com)"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Colour" htmlFor="embed-color">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={`#${(normalizeHex(embed.color) ?? "7C6CF5").toLowerCase()}`}
                    onChange={(e) => set("color", e.target.value.replace("#", "").toUpperCase())}
                    className="h-9 w-12 cursor-pointer rounded-md border border-input bg-background"
                    aria-label="Embed colour picker"
                  />
                  <Input
                    id="embed-color"
                    value={embed.color}
                    onChange={(e) => set("color", e.target.value.toUpperCase())}
                    className="font-mono"
                    maxLength={7}
                  />
                </div>
              </Field>
              <Field label="Footer" htmlFor="embed-footer">
                <Input
                  id="embed-footer"
                  value={embed.footer}
                  onChange={(e) => set("footer", e.target.value)}
                  maxLength={2048}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Author name" htmlFor="embed-author">
                <Input
                  id="embed-author"
                  value={embed.author}
                  onChange={(e) => set("author", e.target.value)}
                  maxLength={256}
                />
              </Field>
              <Field label="Author icon URL" htmlFor="embed-author-icon">
                <Input
                  id="embed-author-icon"
                  value={embed.authorIcon}
                  onChange={(e) => set("authorIcon", e.target.value)}
                  placeholder="https://cdn.discordapp.com/…"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Thumbnail URL" htmlFor="embed-thumb">
                <Input
                  id="embed-thumb"
                  value={embed.thumbnail}
                  onChange={(e) => set("thumbnail", e.target.value)}
                />
              </Field>
              <Field label="Image URL" htmlFor="embed-image">
                <Input
                  id="embed-image"
                  value={embed.image}
                  onChange={(e) => set("image", e.target.value)}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={embed.timestamp}
                onChange={(e) => set("timestamp", e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              Show a timestamp
            </label>
          </Panel>

          <Panel
            title="Fields"
            actions={
              <Button size="sm" variant="outline" onClick={addField}>
                <Plus /> Add field
              </Button>
            }
          >
            {embed.fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No fields yet — they appear as the small columns under your
                description.
              </p>
            ) : (
              <div className="space-y-4">
                {embed.fields.map((field, i) => (
                  <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Field {i + 1}
                      </span>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() =>
                          setEmbed((e) => ({
                            ...e,
                            fields: e.fields.filter((_, idx) => idx !== i),
                          }))
                        }
                        aria-label="Remove field"
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                    <Input
                      value={field.name}
                      placeholder="Name"
                      maxLength={256}
                      onChange={(e) =>
                        setEmbed((u) => ({
                          ...u,
                          fields: u.fields.map((f, idx) =>
                            idx === i ? { ...f, name: e.target.value } : f,
                          ),
                        }))
                      }
                    />
                    <Textarea
                      value={field.value}
                      placeholder="Value"
                      rows={2}
                      maxLength={1024}
                      onChange={(e) =>
                        setEmbed((u) => ({
                          ...u,
                          fields: u.fields.map((f, idx) =>
                            idx === i ? { ...f, value: e.target.value } : f,
                          ),
                        }))
                      }
                    />
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={field.inline}
                        onChange={(e) =>
                          setEmbed((u) => ({
                            ...u,
                            fields: u.fields.map((f, idx) =>
                              idx === i ? { ...f, inline: e.target.checked } : f,
                            ),
                          }))
                        }
                        className="size-3.5 accent-[var(--color-primary)]"
                      />
                      Inline (side by side)
                    </label>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Panel
            title="Live preview"
            description="Renders the way Discord displays it."
            actions={
              <CopyButton value={json} label={copied ? "Copied" : "Copy JSON"} />
            }
          >
            <DiscordPreview
              content={content}
              embed={embed}
              json={json}
              onCopy={() => copy(json)}
            />
          </Panel>
        </div>
      </div>
    </ToolShell>
  );
}

function DiscordPreview({
  content,
  embed,
  json,
  onCopy,
}: {
  content: string;
  embed: EmbedState;
  json: string;
  onCopy: () => void;
}) {
  const hex = normalizeHex(embed.color) ?? "7C6CF5";
  const hasEmbed =
    embed.title ||
    embed.description ||
    embed.thumbnail ||
    embed.image ||
    embed.footer ||
    embed.author ||
    embed.fields.length > 0;

  if (!content.trim() && !hasEmbed) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nothing to preview yet — add content or an embed field.
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={onCopy}>
            <Copy /> Copy empty payload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-[#2b2d31] p-4 text-sm text-[#dbdee1]">
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#5865f2] text-xs font-bold text-white">
            DU
          </div>
          <div className="min-w-0">
            <p className="text-[0.95rem] font-medium text-white">
              DarkUniverse Bot
              <span className="ml-2 rounded bg-[#5865f2] px-1 py-px text-[0.6rem] font-semibold uppercase text-white">
                Bot
              </span>
              <span className="ml-2 text-xs font-normal text-[#949ba4]">Today at {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
            </p>
            {content && (
              <p className="mt-0.5 whitespace-pre-wrap break-words">{content}</p>
            )}

            {hasEmbed && (
              <div
                className="mt-2 max-w-[440px] overflow-hidden rounded border-l-4 bg-[#2b2d31] p-4"
                style={{ borderColor: `#${hex}` }}
              >
                {embed.author && (
                  <div className="mb-2 flex items-center gap-2">
                    {embed.authorIcon && embed.authorIcon.startsWith("http") && (
                       
                      <img src={embed.authorIcon} alt="" className="size-5 rounded-full" />
                    )}
                    <span className="text-sm font-semibold text-white">{embed.author}</span>
                  </div>
                )}
                {embed.title && (
                  <p className="text-sm font-semibold text-white">
                    {embed.url ? (
                      <a href={embed.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {embed.title}
                      </a>
                    ) : (
                      embed.title
                    )}
                  </p>
                )}
                {embed.description && (
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#dbdee1]">
                    {embed.description}
                  </p>
                )}
                {embed.fields.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {embed.fields
                      .filter((f) => f.name.trim() && f.value.trim())
                      .map((f, i) => (
                        <div key={i} className={f.inline ? "" : "col-span-3"}>
                          <p className="text-sm font-semibold text-white">{f.name}</p>
                          <p className="text-sm text-[#dbdee1]">{f.value}</p>
                        </div>
                      ))}
                  </div>
                )}
                {(embed.thumbnail || embed.image) && (
                  <div className="mt-3">
                    {embed.image && embed.image.startsWith("http") && (
                       
                      <img
                        src={embed.image}
                        alt=""
                        className="mt-2 max-h-48 w-full rounded object-cover"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                      />
                    )}
                  </div>
                )}
                {(embed.footer || embed.timestamp) && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#949ba4]">
                    {embed.footer && <span>{embed.footer}</span>}
                    {embed.timestamp && <span>{formatDate(new Date())}</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Webhook payload
          </p>
          <CopyButton value={json} label="Copy JSON" />
        </div>
        <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-[#1e1f22] p-3 text-xs leading-relaxed text-[#b5bac1]">
          {json}
        </pre>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- webhook builder */

export function DiscordWebhookBuilder() {
  const [username, setUsername] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [content, setContent] = React.useState("");
  const [embedJson, setEmbedJson] = React.useState("");
  const [webhookUrl, setWebhookUrl] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState<
    { kind: "success" | "error"; message: string } | null
  >(null);

  const payload = React.useMemo(() => {
    const out: Record<string, unknown> = {};
    if (username.trim()) out.username = username.trim();
    if (avatarUrl.trim()) out.avatar_url = avatarUrl.trim();
    if (content.trim()) out.content = content.trim();
    if (embedJson.trim()) {
      try {
        const parsed = JSON.parse(embedJson);
        out.embeds = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        /* leave invalid JSON out of the payload */
      }
    }
    return out;
  }, [username, avatarUrl, content, embedJson]);

  const json = JSON.stringify(payload, null, 2);
  const embedValid = React.useMemo(() => {
    if (!embedJson.trim()) return true;
    try {
      JSON.parse(embedJson);
      return true;
    } catch {
      return false;
    }
  }, [embedJson]);

  const send = async () => {
    setSending(true);
    setResult(null);
    try {
      const response = await fetch("/api/discord/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl.trim(), payload }),
      });
      const json = await response.json();
      if (response.ok && json.ok) {
        setResult({ kind: "success", message: "Message delivered to Discord." });
      } else {
        setResult({
          kind: "error",
          message: json.error ?? `Discord returned HTTP ${response.status}.`,
        });
      }
    } catch {
      setResult({ kind: "error", message: "Could not reach the server." });
    }
    setSending(false);
  };

  return (
    <ToolShell
      title="Compose and send a webhook message"
      description="Build the payload, preview it, then POST it straight to your Discord webhook."
      aside={
        <InfoCard>
          Webhook URLs are posted through our server (browser CORS would block
          them otherwise) and the target host is restricted to discord.com to
          prevent misuse. Never paste a webhook URL into a public channel.
        </InfoCard>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Panel title="Webhook">
            <Field label="Webhook URL" htmlFor="webhook-url">
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/…"
                className="font-mono text-xs"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bot name (optional)" htmlFor="webhook-name">
                <Input
                  id="webhook-name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={80}
                  placeholder="DarkUniverse Updates"
                />
              </Field>
              <Field label="Avatar URL (optional)" htmlFor="webhook-avatar">
                <Input
                  id="webhook-avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://cdn.discordapp.com/…"
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Message">
            <Field label="Content" htmlFor="webhook-content">
              <Textarea
                id="webhook-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="**Update** — version 2.4 is live!"
              />
            </Field>
            <Field
              label="Embeds (JSON array)"
              hint={embedValid ? undefined : "Invalid JSON"}
              htmlFor="webhook-embeds"
            >
              <Textarea
                id="webhook-embeds"
                value={embedJson}
                onChange={(e) => setEmbedJson(e.target.value)}
                rows={6}
                className={`font-mono text-xs ${embedValid ? "" : "border-destructive"}`}
                placeholder='[{"title":"Patch notes","description":"…","color":8170245}]'
              />
            </Field>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel
            title="Payload preview"
            actions={<CopyButton value={json} label="Copy payload" />}
          >
            <pre className="max-h-80 overflow-auto rounded-lg border border-border bg-[#1e1f22] p-3 text-xs leading-relaxed text-[#b5bac1]">
              {json}
            </pre>
          </Panel>

          <Panel title="Send">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={send}
                disabled={sending || !webhookUrl.trim() || (!content.trim() && !embedJson.trim())}
              >
                {sending ? "Sending…" : <><Send /> Send to Discord</>}
              </Button>
              <span className="text-xs text-muted-foreground">
                Sends once — this is not a scheduled job.
              </span>
            </div>
            {result && (
              <Alert variant={result.kind === "success" ? "success" : "destructive"}>
                {result.message}
              </Alert>
            )}
          </Panel>
        </div>
      </div>
    </ToolShell>
  );
}

/* -------------------------------------------------- snowflake decoder */

export function DiscordSnowflakeDecoder() {
  const [value, setValue] = React.useState("");
  const decoded = decodeSnowflake(value);

  return (
    <ToolShell
      title="Decode any Discord ID"
      description="Messages, users, channels, servers and roles all encode their creation time."
      aside={
        <InfoCard>
          Snowflakes pack a millisecond timestamp, a worker ID, a process ID
          and a per-process counter into 64 bits.
        </InfoCard>
      }
    >
      <Panel>
        <Field label="Discord snowflake (17–20 digits)" htmlFor="snowflake">
          <Input
            id="snowflake"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
            placeholder="102394029418394"
            inputMode="numeric"
            className="font-mono"
          />
        </Field>

        {value && !decoded.isValid && (
          <Alert variant="destructive">{decoded.error}</Alert>
        )}

        {decoded.isValid && (
          <>
            <KeyValue
              items={[
                { label: "Created", value: formatTimestamp(decoded.timestampMs / 1000, "F") },
                { label: "Relative", value: formatRelativeTime(decoded.date) },
                { label: "Unix (ms)", value: decoded.timestampMs, mono: true },
                { label: "Unix (s)", value: Math.floor(decoded.timestampMs / 1000), mono: true },
                { label: "ISO 8601", value: decoded.date.toISOString(), mono: true },
                { label: "Worker ID", value: decoded.workerId, mono: true },
                { label: "Process ID", value: parsedProcess(decoded.processId), mono: true },
                { label: "Increment", value: decoded.increment, mono: true },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <CopyButton value={decoded.date.toISOString()} label="Copy ISO time" />
              <CopyButton
                value={String(Math.floor(decoded.timestampMs / 1000))}
                label="Copy Unix seconds"
              />
              <CopyButton value={String(decoded.timestampMs)} label="Copy Unix ms" />
            </div>
          </>
        )}
      </Panel>

      <Panel title="How it breaks down" description="Bit layout of a Discord snowflake.">
        <div className="space-y-2 font-mono text-xs">
          {[
            { bits: "42 bits", label: "Milliseconds since Discord's epoch (2015-01-01)", value: decoded.timestampMs },
            { bits: "10 bits", label: "Worker ID", value: decoded.workerId },
            { bits: "10 bits", label: "Process ID", value: decoded.processId },
            { bits: "12 bits", label: "Increment", value: decoded.increment },
          ].map((row) => (
            <div
              key={row.bits}
              className="flex items-center justify-between gap-3 rounded border border-border bg-surface px-3 py-2"
            >
              <span className="w-20 text-primary">{row.bits}</span>
              <span className="flex-1 text-muted-foreground">{row.label}</span>
              <span className="text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </Panel>
    </ToolShell>
  );
}

function parsedProcess(pid: number) {
  return pid;
}

/* ------------------------------------------------------- invite info */

interface InviteData {
  code: string;
  guild: {
    id: string;
    name: string;
    icon?: string | null;
    description?: string | null;
    vanity_url_code?: string | null;
    approximate_member_count?: number;
    approximate_presence_count?: number;
    features?: string[];
  } | null;
  channel?: { id: string; name?: string; type?: number } | null;
  inviter?: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
  expiresAt: string | null;
  inviteUrl: string;
}

export function DiscordInviteInfo() {
  const [value, setValue] = React.useState("");
  const [data, setData] = React.useState<InviteData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const lookup = async (raw: string) => {
    setLoading(true);
    setError(null);
    const res = await apiGet<InviteData>(
      `/api/discord/invite?code=${encodeURIComponent(raw)}`,
    );
    if (res.ok) setData(res.data);
    else {
      setData(null);
      setError(res.error);
    }
    setLoading(false);
  };

  return (
    <ToolShell
      title="Discord invite lookup"
      description="Server name, member counts, vanity, expiry and the inviter."
      aside={
        <InfoCard>
          Reads Discord&apos;s public invite endpoint. Deleted or expired
          invites return a clear error rather than stale data.
        </InfoCard>
      }
    >
      <Panel>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) lookup(value.trim());
          }}
          className="space-y-3"
        >
          <Field label="Invite code or URL" htmlFor="invite">
            <Input
              id="invite"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="discord.gg/yourserver"
            />
          </Field>
          <Button type="submit" disabled={loading || !value.trim()}>
            <Search />
            {loading ? "Checking…" : "Check invite"}
          </Button>
        </form>
      </Panel>

      {error && (
        <Alert variant="destructive">
          <span className="font-medium">Lookup failed.</span> {error}
        </Alert>
      )}

      {data && (
        <Panel
          title={data.guild?.name ?? data.code}
          description={data.guild?.description ?? "No server description."}
          actions={<CopyButton value={data.inviteUrl} label="Copy invite" />}
        >
          <div className="flex items-start gap-4">
            <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
              {data.guild?.icon && (
                 
                <img
                  src={`https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png?size=128`}
                  alt=""
                  className="size-full object-cover"
                />
              )}
            </div>
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <KeyValue
                columns={1}
                items={[
                  { label: "Server ID", value: data.guild?.id ?? "—", mono: Boolean(data.guild?.id) },
                  {
                    label: "Members",
                    value: data.guild?.approximate_member_count
                      ? data.guild.approximate_member_count.toLocaleString()
                      : "Unknown",
                  },
                  {
                    label: "Online now",
                    value: data.guild?.approximate_presence_count
                      ? data.guild.approximate_presence_count.toLocaleString()
                      : "Unknown",
                  },
                  { label: "Vanity", value: data.guild?.vanity_url_code ?? "None" },
                  {
                    label: "Default channel",
                    value: data.channel?.name ? `#${data.channel.name}` : "—",
                  },
                  {
                    label: "Expires",
                    value: data.expiresAt ? formatDate(data.expiresAt) : "Never",
                  },
                ]}
              />
            </div>
          </div>

          {data.guild?.features && data.guild.features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.guild.features.map((feature) => (
                <Badge key={feature} variant="secondary">
                  {feature.replaceAll("_", " ").toLowerCase()}
                </Badge>
              ))}
            </div>
          )}

          {data.inviter && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
              {data.inviter.avatarUrl ? (
                 
                <img src={data.inviter.avatarUrl} alt="" className="size-8 rounded-full" />
              ) : (
                <div className="grid size-8 place-items-center rounded-full bg-[#5865f2] text-xs font-bold text-white">
                  ?
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {data.inviter.displayName ?? data.inviter.username}
                </p>
                <p className="text-xs text-muted-foreground">
                  Invited by @{data.inviter.username}
                </p>
              </div>
            </div>
          )}
        </Panel>
      )}
    </ToolShell>
  );
}

/* ---------------------------------------------------- colour converter */

export function DiscordColorConverter() {
  const [input, setInput] = React.useState("7C6CF5");
  const [mode, setMode] = React.useState<"hex" | "rgb" | "hsl" | "int">("hex");

  const rgb = React.useMemo(() => {
    if (mode === "hex") return hexToRgb(input);
    if (mode === "rgb") {
      const m = input.match(/(\d+)\D+(\d+)\D+(\d+)/);
      return m
        ? {
            r: Math.min(255, +m[1]),
            g: Math.min(255, +m[2]),
            b: Math.min(255, +m[3]),
          }
        : null;
    }
    if (mode === "int") {
      const n = Number(input.trim());
      return Number.isFinite(n) && input.trim() !== "" ? intToRgb(n) : null;
    }
    const m = input.trim().match(/^(\d{1,3})\D+(\d{1,3})%?\D+(\d{1,3})%?$/);
    return m ? hslToRgb(Number(m[1]), Number(m[2]), Number(m[3])) : null;
  }, [input, mode]);

  const values = rgb
    ? {
        hex: rgbToHex(rgb),
        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        hsl: (() => {
          const { h, s, l } = rgbToHsl(rgb);
          return `hsl(${h}, ${s}%, ${l}%)`;
        })(),
        int: rgbToInt(rgb),
      }
    : null;

  const previewHex = values?.hex ?? "7C6CF5";

  return (
    <ToolShell
      title="Convert embed colours"
      description="HEX, RGB, HSL and Discord's decimal integer — plus the official palette."
      aside={
        <InfoCard>
          Discord embeds take the colour as a decimal integer (0–16777215).
          Our converter keeps every format in sync as you type.
        </InfoCard>
      }
    >
      <Panel>
        <div className="flex flex-wrap gap-2">
          {(["hex", "rgb", "hsl", "int"] as const).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? "default" : "outline"}
              onClick={() => setMode(m)}
            >
              {m.toUpperCase()}
            </Button>
          ))}
        </div>
        <Field
          label={
            mode === "hex"
              ? "HEX"
              : mode === "rgb"
                ? "RGB (255, 255, 255)"
                : mode === "hsl"
                  ? "HSL (260, 85%, 65%)"
                  : "Decimal integer"
          }
          htmlFor="color-input"
        >
          <Input
            id="color-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="font-mono"
          />
        </Field>
        {!values && <Alert variant="destructive">That value doesn't parse as a colour.</Alert>}
        {values && (
          <div className="flex items-center gap-4">
            <div
              className="size-16 rounded-lg border border-border"
              style={{ background: `#${previewHex}` }}
              aria-label="Colour preview"
            />
            <div className="grid flex-1 gap-2">
              {Object.entries(values).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-3 rounded border border-border bg-surface px-3 py-2"
                >
                  <span className="text-xs uppercase text-muted-foreground">{k}</span>
                  <span className="font-mono text-sm">{String(v)}</span>
                  <CopyButton value={String(v)} label="Copy" />
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Discord's official palette" description="Tap to load a colour.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {discordPalette.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => {
                setMode("hex");
                setInput(c.hex);
              }}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-primary/40"
            >
              <span
                className="size-5 rounded border border-black/30"
                style={{ background: `#${c.hex}` }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm">{c.name}</span>
                <span className="block font-mono text-xs text-muted-foreground">#{c.hex}</span>
              </span>
            </button>
          ))}
        </div>
      </Panel>
    </ToolShell>
  );
}

/* ------------------------------------------- avatar / banner preview */

interface DiscordUserData {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrls: string[];
  avatarGif: string | null;
  defaultAvatar: string;
  bannerUrls: string[];
  bannerColor: string | null;
}

function DiscordUserLookup({
  kind,
}: {
  kind: "avatar" | "banner";
}) {
  const [id, setId] = React.useState("");
  const [data, setData] = React.useState<DiscordUserData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [botMissing, setBotMissing] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const lookup = async () => {
    setLoading(true);
    setError(null);
    setBotMissing(false);
    const res = await apiGet<DiscordUserData>(
      `/api/discord/user?id=${encodeURIComponent(id.trim())}`,
    );
    if (res.ok) setData(res.data);
    else {
      setData(null);
      if ((res as { error: string }).error.includes("DISCORD_BOT_TOKEN")) {
        setBotMissing(true);
      } else {
        setError(res.error);
      }
    }
    setLoading(false);
  };

  const urls = kind === "avatar" ? data?.avatarUrls ?? [] : data?.bannerUrls ?? [];

  return (
    <>
      <Panel>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (/^\d{17,20}$/.test(id.trim())) lookup();
          }}
          className="space-y-3"
        >
          <Field
            label="Discord user ID (17–20 digits)"
            htmlFor="discord-id"
            hint={
              <a
                href="https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                How do I find it?
              </a>
            }
          >
            <Input
              id="discord-id"
              value={id}
              onChange={(e) => setId(e.target.value.replace(/\D/g, ""))}
              placeholder="102394029418394"
              inputMode="numeric"
              className="font-mono"
            />
          </Field>
          <Button type="submit" disabled={loading || !/^\d{17,20}$/.test(id.trim())}>
            <Search />
            {loading ? "Fetching…" : "Fetch user"}
          </Button>
        </form>
      </Panel>

      {botMissing && (
        <Alert variant="warning">
          <span className="font-medium">Bot token not configured.</span>{" "}
          <code className="font-mono">DISCORD_BOT_TOKEN</code> must be set on
          the server to read user profiles — Discord does not expose them
          publicly. Add it to your Vercel environment variables, then redeploy.
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <span className="font-medium">Lookup failed.</span> {error}
        </Alert>
      )}

      {data && (
        <Panel
          title={data.displayName ?? data.username}
          description={`@${data.username} · ${data.id}`}
          actions={<CopyButton value={data.id} label="Copy ID" />}
        >
          {urls.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {kind === "avatar"
                ? "This user has no custom avatar — Discord uses the default one."
                : "This user has no profile banner set."}
            </p>
          ) : (
            <div className="grid gap-4">
              <div className="overflow-hidden rounded-lg border border-border bg-surface">
                {kind === "banner" ? (
                   
                  <img src={urls[urls.length - 1]} alt="Banner" className="w-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center p-6">
                    { }
                    <img
                      src={data.avatarGif ?? urls[urls.length - 1]}
                      alt="Avatar"
                      className="size-40 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                  All available sizes
                </p>
                <div className="flex flex-wrap gap-2">
                  {urls.map((url, i) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 font-mono text-xs transition-colors hover:border-primary/40"
                    >
                      {kind === "avatar" ? [16, 32, 64, 128, 256, 512, 1024][i] : [64, 128, 256, 512, 1024, 2048][i]}px
                    </a>
                  ))}
                  {data.avatarGif && kind === "avatar" && (
                    <a
                      href={data.avatarGif}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1.5 font-mono text-xs"
                    >
                      GIF
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className="size-8 rounded border border-border"
                  style={{ background: data.bannerColor ?? "#5865F2" }}
                />
                <div>
                  <p className="text-sm font-medium">{data.bannerColor ?? "No accent colour"}</p>
                  <p className="text-xs text-muted-foreground">Profile accent</p>
                </div>
                {data.bannerColor && <CopyButton value={data.bannerColor} label="Copy" />}
              </div>
            </div>
          )}
        </Panel>
      )}
    </>
  );
}

export function DiscordAvatarPreview() {
  return (
    <ToolShell
      title="Preview a Discord avatar"
      description="Fetches every CDN size, plus the animated version when the avatar is a GIF."
      aside={
        <InfoCard>
          Requires <code className="font-mono">DISCORD_BOT_TOKEN</code> on the
          server. Without it we show an explanation instead of pretending to
          have data.
        </InfoCard>
      }
    >
      <DiscordUserLookup kind="avatar" />
    </ToolShell>
  );
}

export function DiscordBannerPreview() {
  return (
    <ToolShell
      title="Preview a Discord banner"
      description="Profile banners at every supported resolution, plus the accent colour."
      aside={
        <InfoCard>
          Requires <code className="font-mono">DISCORD_BOT_TOKEN</code>. Works
          for user profiles; server banners need the guild endpoints.
        </InfoCard>
      }
    >
      <DiscordUserLookup kind="banner" />
    </ToolShell>
  );
}
