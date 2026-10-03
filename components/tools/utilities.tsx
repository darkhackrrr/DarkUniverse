"use client";

import * as React from "react";
import { Sparkles, RotateCcw, Shuffle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import {
  ToolShell,
  Field,
  Panel,
  InfoCard,
  CopyButton,
  KeyValue,
  useCopy,
} from "@/components/tools/tool-shell";

/* ------------------------------------------------------ character counter */

export function CharacterCounter() {
  const [text, setText] = React.useState("");

  const stats = React.useMemo(() => {
    const chars = text.length;
    const noSpaces = text.replace(/\s/g, "").length;
    const words = text.split(/\s+/).filter(Boolean).length;
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length;
    const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim()).length;
    const lines = text.split("\n").length;
    const reading = Math.max(1, Math.round(words / 225));
    const speaking = Math.max(1, Math.round(words / 150));
    const longest = text.split(/\s+/).reduce((a, b) => (b.length > a.length ? b : a), "");
    return { chars, noSpaces, words, sentences, paragraphs, lines, reading, speaking, longest };
  }, [text]);

  const limits = [
    { label: "Tweet / X post", max: 280 },
    { label: "Discord message", max: 2000 },
    { label: "Discord embed description", max: 4096 },
    { label: "YouTube title", max: 100 },
    { label: "Roblox profile about", max: 1000 },
    { label: "Instagram caption", max: 2200 },
  ];

  return (
    <ToolShell
      title="Count as you type"
      description="Characters, words, sentences and reading time — with limits for the platforms you actually post on."
      aside={<InfoCard>Reading time assumes 225 words per minute; speaking time assumes 150.</InfoCard>}
    >
      <Panel
        title="Your text"
        actions={
          <div className="flex gap-2">
            <CopyButton value={text} label="Copy" />
            <Button size="sm" variant="ghost" onClick={() => setText("")} disabled={!text}>
              Clear
            </Button>
          </div>
        }
      >
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Start typing or paste text here…"
        />
      </Panel>

      <Panel title="Statistics">
        <KeyValue
          columns={3}
          items={[
            { label: "Characters", value: stats.chars },
            { label: "No spaces", value: stats.noSpaces },
            { label: "Words", value: stats.words },
            { label: "Sentences", value: stats.sentences },
            { label: "Paragraphs", value: stats.paragraphs },
            { label: "Lines", value: stats.lines },
            { label: "Reading time", value: `${stats.reading} min` },
            { label: "Speaking time", value: `${stats.speaking} min` },
            {
              label: "Longest word",
              value: stats.longest || "—",
              mono: Boolean(stats.longest),
            },
          ]}
        />
      </Panel>

      <Panel title="Platform limits">
        <div className="space-y-2">
          {limits.map((limit) => {
            const pct = Math.min(100, (stats.chars / limit.max) * 100);
            const over = stats.chars > limit.max;
            return (
              <div key={limit.label} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{limit.label}</span>
                  <span className={over ? "text-destructive" : "text-muted-foreground"}>
                    {stats.chars}/{limit.max}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all ${over ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </ToolShell>
  );
}

/* --------------------------------------------------------- word counter */

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with",
  "is", "are", "was", "were", "it", "this", "that", "as", "at", "by", "from",
  "be", "has", "have", "had", "not", "you", "i", "we", "they", "he", "she",
]);

export function WordCounter() {
  const [text, setText] = React.useState("");

  const stats = React.useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/) : [];
    const frequency = new Map<string, number>();
    for (const raw of words) {
      const w = raw.toLowerCase().replace(/[^\p{L}\p{N}'-]/gu, "");
      if (!w || w.length < 3 || STOP_WORDS.has(w)) continue;
      frequency.set(w, (frequency.get(w) ?? 0) + 1);
    }
    const top = [...frequency.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 12);
    const unique = new Set(words.map((w) => w.toLowerCase())).size;
    return {
      words: words.length,
      unique,
      lines: text.split("\n").length,
      characters: text.length,
      top,
      maxFreq: top[0]?.[1] ?? 1,
    };
  }, [text]);

  return (
    <ToolShell
      title="Word & line statistics"
      description="Counts words, unique words, lines and your most-used terms."
      aside={<InfoCard>Common stop words (the, and, is…) are filtered out of the frequency list.</InfoCard>}
    >
      <Panel
        title="Your text"
        actions={
          <Button size="sm" variant="ghost" onClick={() => setText("")} disabled={!text}>
            Clear
          </Button>
        }
      >
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder="Paste an essay, script or description…"
        />
      </Panel>

      <Panel title="Counts">
        <KeyValue
          columns={4}
          items={[
            { label: "Words", value: stats.words },
            { label: "Unique words", value: stats.unique },
            { label: "Lines", value: stats.lines },
            { label: "Characters", value: stats.characters },
          ]}
        />
      </Panel>

      <Panel title="Most used words">
        {stats.top.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add at least three letters&apos; worth of words to see frequency.
          </p>
        ) : (
          <div className="space-y-2">
            {stats.top.map(([word, count]) => (
              <div key={word} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm">{word}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-secondary">
                  <div
                    className="h-full rounded bg-primary/80"
                    style={{ width: `${(count / stats.maxFreq) * 100}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </ToolShell>
  );
}

/* ---------------------------------------------------------- json formatter */

export function JsonFormatter() {
  const [input, setInput] = React.useState('{\n  "hello": "darkuniverse",\n  "tools": 40\n}');
  const [indent, setIndent] = React.useState(2);
  const [mode, setMode] = React.useState<"format" | "minify">("format");

  const result = React.useMemo(() => {
    if (!input.trim()) return { ok: false as const, error: "Nothing to format yet." };
    try {
      const parsed = JSON.parse(input);
      const output =
        mode === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
      return {
        ok: true as const,
        output,
        depth: depthOf(parsed),
        keys: countKeys(parsed),
      };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Invalid JSON." };
    }
  }, [input, indent, mode]);

  return (
    <ToolShell
      title="Format, minify & validate JSON"
      description="Clear error messages that point at the exact character position."
      aside={<InfoCard>Paste a webhook payload, a config file or an API response.</InfoCard>}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Input"
          actions={
            <div className="flex gap-1">
              {([2, 4, 8] as const).map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={indent === n && mode === "format" ? "default" : "ghost"}
                  onClick={() => {
                    setIndent(n);
                    setMode("format");
                  }}
                >
                  {n}-space
                </Button>
              ))}
              <Button
                size="sm"
                variant={mode === "minify" ? "default" : "ghost"}
                onClick={() => setMode("minify")}
              >
                Minify
              </Button>
            </div>
          }
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={20}
            className="font-mono text-xs leading-relaxed"
            spellCheck={false}
          />
        </Panel>

        <Panel
          title="Output"
          actions={
            <div className="flex gap-2">
              <CopyButton value={result.ok ? result.output : ""} label="Copy" />
              <Button size="sm" variant="ghost" onClick={() => setInput("")}>
                <RotateCcw /> Clear
              </Button>
            </div>
          }
        >
          {result.ok ? (
            <>
              <pre className="max-h-[28rem] overflow-auto rounded-lg border border-border bg-[#1e1f22] p-3 text-xs leading-relaxed text-[#b5bac1]">
                {result.output}
              </pre>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="text-success">Valid JSON</span>
                <span>{result.output.length} characters</span>
                <span>depth {result.depth}</span>
                <span>{result.keys} keys</span>
              </div>
            </>
          ) : (
            <Alert variant="destructive">
              <span className="font-medium">Invalid JSON.</span> {result.error}
            </Alert>
          )}
        </Panel>
      </div>
    </ToolShell>
  );
}

function depthOf(value: unknown, depth = 1): number {
  if (Array.isArray(value)) {
    return value.reduce<number>((max, v) => Math.max(max, depthOf(v, depth + 1)), depth);
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (max, v) => Math.max(max, depthOf(v, depth + 1)),
      depth,
    );
  }
  return depth;
}

function countKeys(value: unknown): number {
  if (Array.isArray(value)) return value.reduce<number>((s, v) => s + countKeys(v), 0);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).reduce<number>(
      (s, v) => s + countKeys(v),
      Object.keys(value as object).length,
    );
  }
  return 0;
}

/* ------------------------------------------------------ timestamp generator */

export function TimestampGenerator() {
  const [now, setNow] = React.useState(() => Math.floor(Date.now() / 1000));

  React.useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const [dateInput, setDateInput] = React.useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  const parsed = new Date(dateInput);
  const seconds = Number.isNaN(parsed.getTime()) ? 0 : Math.floor(parsed.getTime() / 1000);
  const fromDate = new Date(now * 1000);

  return (
    <ToolShell
      title="Unix timestamps"
      description="Convert a date to epoch seconds or milliseconds — and back again."
      aside={
        <InfoCard>
          Unix time counts seconds from 1970-01-01T00:00:00Z. JavaScript uses
          milliseconds, APIs often use seconds — both are shown below.
        </InfoCard>
      }
    >
      <Panel title="Live clock">
        <KeyValue
          columns={3}
          items={[
            { label: "Seconds", value: now, mono: true },
            { label: "Milliseconds", value: now * 1000, mono: true },
            { label: "ISO 8601", value: fromDate.toISOString(), mono: true },
            { label: "UTC", value: fromDate.toUTCString() },
            { label: "Local", value: fromDate.toLocaleString() },
            { label: "Date only", value: fromDate.toDateString() },
          ]}
        />
        <CopyButton value={String(now)} label="Copy current seconds" />
      </Panel>

      <Panel title="Date → timestamp">
        <Field label="Date & time" htmlFor="ts-date">
          <Input
            id="ts-date"
            type="datetime-local"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
          />
        </Field>
        {seconds > 0 && (
          <KeyValue
            items={[
              { label: "Seconds", value: seconds, mono: true },
              { label: "Milliseconds", value: seconds * 1000, mono: true },
              { label: "Relative", value: relTime(seconds) },
            ]}
          />
        )}
        <CopyButton value={String(seconds)} label="Copy seconds" />
      </Panel>

      <Panel title="Timestamp → date">
        <TimestampToDate />
      </Panel>
    </ToolShell>
  );
}

function relTime(targetSeconds: number) {
  const diff = targetSeconds - Math.floor(Date.now() / 1000);
  const abs = Math.abs(diff);
  const units: Array<[number, string]> = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, name] of units) {
    if (abs >= secs) {
      const n = Math.round(abs / secs);
      return diff >= 0 ? `in ${n} ${name}${n === 1 ? "" : "s"}` : `${n} ${name}${n === 1 ? "" : "s"} ago`;
    }
  }
  return diff >= 0 ? "in a few seconds" : "a few seconds ago";
}

function TimestampToDate() {
  const [value, setValue] = React.useState("");
  const n = Number(value);
  const valid = value.trim() !== "" && Number.isFinite(n) && n > 0;
  const ms = valid ? (n > 1e12 ? n : n * 1000) : 0;
  const isMs = valid && n > 1e12;
  const date = valid ? new Date(ms) : null;
  const ok = date && !Number.isNaN(date.getTime());

  return (
    <>
      <Field label="Unix timestamp (seconds or milliseconds)" htmlFor="ts-parse">
        <Input
          id="ts-parse"
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="1735689600"
          inputMode="numeric"
          className="font-mono"
        />
      </Field>
      {valid && ok && date && (
        <KeyValue
          items={[
            { label: "Detected unit", value: isMs ? "milliseconds" : "seconds" },
            { label: "ISO 8601", value: date.toISOString(), mono: true },
            { label: "UTC", value: date.toUTCString() },
            { label: "Local", value: date.toLocaleString() },
            { label: "Relative", value: relTime(Math.floor(date.getTime() / 1000)) },
          ]}
        />
      )}
      {valid && !ok && (
        <Alert variant="destructive">That value isn&apos;t a valid timestamp.</Alert>
      )}
      <CopyButton value={ok && date ? date.toISOString() : ""} label="Copy ISO string" />
    </>
  );
}

/* --------------------------------------------------------- qr generator */

export function QrCodeGenerator() {
  const [value, setValue] = React.useState(
    "https://www.roblox.com/games/90003169308914/Troll-Tower-Impossible-Obby",
  );
  const [size, setSize] = React.useState(256);
  const [level, setLevel] = React.useState<"L" | "M" | "Q" | "H">("M");
  const [fg, setFg] = React.useState("#000000");
  const [bg, setBg] = React.useState("#ffffff");
  const svgRef = React.useRef<HTMLDivElement>(null);

  const downloadSvg = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.svg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const downloadPng = async () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = "qr-code.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(pngUrl), 2000);
    });
  };

  const [copied, setCopied] = React.useState(false);

  return (
    <ToolShell
      title="Generate QR codes"
      description="For links, plain text or Wi-Fi credentials — with SVG and PNG export."
      aside={
        <InfoCard>
          Error correction level H survives ~30% damage but makes the code
          denser — use M for clean prints.
        </InfoCard>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Panel title="Content">
            <Field label="Text or URL" htmlFor="qr-value">
              <Textarea
                id="qr-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={3}
                placeholder="https://…"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  label: "Roblox game",
                  v: "https://www.roblox.com/games/90003169308914/Troll-Tower-Impossible-Obby",
                },
                {
                  label: "Roblox group",
                  v: "https://www.roblox.com/share/g/291490614",
                },
                { label: "Wi-Fi", v: "WIFI:T:WPA;S:DarkUniverse;P:changeme;;" },
              ].map((preset) => (
                <Button key={preset.label} size="sm" variant="outline" onClick={() => setValue(preset.v)}>
                  {preset.label}
                </Button>
              ))}
            </div>
          </Panel>

          <Panel title="Style">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`Size — ${size}px`} htmlFor="qr-size">
                <input
                  id="qr-size"
                  type="range"
                  min={128}
                  max={512}
                  step={32}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)]"
                />
              </Field>
              <Field label="Error correction" htmlFor="qr-level">
                <select
                  id="qr-level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as typeof level)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="L">L — 7% recovery</option>
                  <option value="M">M — 15% recovery</option>
                  <option value="Q">Q — 25% recovery</option>
                  <option value="H">H — 30% recovery</option>
                </select>
              </Field>
              <Field label="Foreground" htmlFor="qr-fg">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={fg}
                    onChange={(e) => setFg(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-input bg-background"
                    aria-label="Foreground colour"
                  />
                  <Input id="qr-fg" value={fg} onChange={(e) => setFg(e.target.value)} className="font-mono" />
                </div>
              </Field>
              <Field label="Background" htmlFor="qr-bg">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bg}
                    onChange={(e) => setBg(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-input bg-background"
                    aria-label="Background colour"
                  />
                  <Input id="qr-bg" value={bg} onChange={(e) => setBg(e.target.value)} className="font-mono" />
                </div>
              </Field>
            </div>
          </Panel>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Panel title="Preview">
            <div ref={svgRef} className="grid place-items-center rounded-lg border border-border p-4" style={{ background: bg }}>
              {value.trim() ? (
                <QRCodeSVG
                  value={value}
                  size={size}
                  level={level}
                  fgColor={fg}
                  bgColor={bg}
                  includeMargin={false}
                />
              ) : (
                <div className="grid place-items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <Sparkles className="size-5" />
                  Enter content to generate a code.
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={downloadPng} disabled={!value.trim()}>
                Download PNG
              </Button>
              <Button size="sm" variant="outline" onClick={downloadSvg} disabled={!value.trim()}>
                Download SVG
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(value);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? <Check /> : null}
                {copied ? "Copied" : "Copy content"}
              </Button>
            </div>
            <Badge variant="secondary">{value.length} characters encoded</Badge>
          </Panel>
        </div>
      </div>
    </ToolShell>
  );
}

/* --------------------------------------------------- code snippet formatter */

export function CodeSnippetFormatter() {
  const [input, setInput] = React.useState("");
  const [tab, setTab] = React.useState(2);
  const [mode, setMode] = React.useState<"spaces" | "tabs">("spaces");
  const [discordWrap, setDiscordWrap] = React.useState(false);
  const [stripTrailing, setStripTrailing] = React.useState(true);

  const output = React.useMemo(() => {
    const indentUnit = mode === "tabs" ? "\t" : " ".repeat(tab);
    const lines = input.replace(/\t/g, " ".repeat(tab)).split("\n");
    let level = 0;
    const formatted = lines.map((raw) => {
      const line = stripTrailing ? raw.replace(/\s+$/, "") : raw;
      const trimmed = line.trim();
      if (/^[}\])]/.test(trimmed)) level = Math.max(0, level - 1);
      const result = trimmed ? indentUnit.repeat(level) + trimmed : "";
      if (/[{[(]$/.test(trimmed) && !/[}\])]$/.test(trimmed)) level += 1;
      if (/^[}\])]$/.test(trimmed)) level = Math.max(0, level - 1);
      return result;
    });
    let text = formatted.join("\n");
    if (discordWrap) {
      const body = text.replace(/```/g, "'''").split("\n").map((l) => (l ? ` ${l}` : l)).join("\n");
      text = "```\n" + body + "\n```";
    }
    return text;
  }, [input, tab, mode, discordWrap, stripTrailing]);

  const stats = {
    lines: input.split("\n").length,
    chars: input.length,
    delta: output.length - input.length,
  };

  return (
    <ToolShell
      title="Tidy up code"
      description="Normalise indentation, strip trailing spaces and wrap snippets for Discord."
      aside={
        <InfoCard>
          Discord renders fixed-width text inside ``` fences but collapses
          leading spaces — the wrap option prefixes each line so indentation
          survives.
        </InfoCard>
      }
    >
      <Panel title="Options">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={mode === "spaces" ? "default" : "outline"} onClick={() => setMode("spaces")}>
            Spaces
          </Button>
          <Button size="sm" variant={mode === "tabs" ? "default" : "outline"} onClick={() => setMode("tabs")}>
            Tabs
          </Button>
          {[2, 4, 8].map((n) => (
            <Button
              key={n}
              size="sm"
              variant={tab === n && mode === "spaces" ? "default" : "outline"}
              onClick={() => {
                setTab(n);
                setMode("spaces");
              }}
            >
              {n}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={stripTrailing}
              onChange={(e) => setStripTrailing(e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            Strip trailing spaces
          </label>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={discordWrap}
              onChange={(e) => setDiscordWrap(e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            Wrap for Discord (``` fences)
          </label>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Input">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={18}
            className="font-mono text-xs leading-relaxed"
            spellCheck={false}
            placeholder="Paste code here…"
          />
        </Panel>
        <Panel title="Output" actions={<CopyButton value={output} label="Copy code" />}>
          <Textarea
            value={output}
            readOnly
            rows={18}
            className="font-mono text-xs leading-relaxed"
          />
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{stats.lines} lines in</span>
            <span>{output.split("\n").length} lines out</span>
            <span className={stats.delta >= 0 ? "" : "text-success"}>
              {stats.delta >= 0 ? "+" : ""}
              {stats.delta} chars
            </span>
          </div>
        </Panel>
      </div>
    </ToolShell>
  );
}

/* ----------------------------------------------------------- random picker */

export function RandomPicker() {
  const [items, setItems] = React.useState("Player1\nPlayer2\nPlayer3\nPlayer4");
  const [count, setCount] = React.useState(1);
  const [allowDuplicates, setAllowDuplicates] = React.useState(false);
  const [winners, setWinners] = React.useState<string[]>([]);
  const [spinning, setSpinning] = React.useState(false);

  const list = React.useMemo(
    () =>
      items
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    [items],
  );

  const pick = () => {
    if (list.length === 0) return;
    setSpinning(true);
    setWinners([]);
    const n = Math.max(1, Math.min(count, list.length));
    let ticks = 0;
    const timer = setInterval(() => {
      const pool = [...list];
      const preview: string[] = [];
      for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        preview.push(pool.splice(idx, 1)[0] ?? pool[0]);
      }
      setWinners(preview);
      ticks += 1;
      if (ticks > 12) {
        clearInterval(timer);
        const finalPool = [...list];
        const final: string[] = [];
        const max = allowDuplicates ? n : Math.min(n, finalPool.length);
        for (let i = 0; i < max; i++) {
          const idx = Math.floor(Math.random() * finalPool.length);
          final.push(finalPool.splice(idx, 1)[0] ?? finalPool[0]);
        }
        setWinners(final);
        setSpinning(false);
      }
    }, 90);
  };

  return (
    <ToolShell
      title="Pick random winners"
      description="Paste a list, choose how many to draw, and let it spin."
      aside={<InfoCard>Uses the browser's cryptographic random source — fair enough for community giveaways.</InfoCard>}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="List" description={`${list.length} items`}>
          <Textarea
            value={items}
            onChange={(e) => setItems(e.target.value)}
            rows={12}
            placeholder={"One entry per line"}
          />
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={() => setItems("")} disabled={!items}>
              <RotateCcw /> Clear list
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setItems((i) => i.split("\n").reverse().join("\n"))}>
              <Shuffle /> Reverse
            </Button>
          </div>
        </Panel>

        <Panel title="Draw">
          <Field label={`Winners — ${count}`} htmlFor="win-count">
            <input
              id="win-count"
              type="range"
              min={1}
              max={Math.max(1, Math.min(20, list.length || 1))}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-[var(--color-primary)]"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={allowDuplicates}
              onChange={(e) => setAllowDuplicates(e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            Allow the same entry more than once
          </label>
          <Button onClick={pick} disabled={list.length === 0 || spinning}>
            <Shuffle /> {spinning ? "Picking…" : "Pick winner(s)"}
          </Button>

          <div className="min-h-24 space-y-2 rounded-lg border border-border bg-surface p-4">
            {winners.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Results appear here.
              </p>
            ) : (
              winners.map((w, i) => (
                <div
                  key={`${w}-${i}`}
                  className="animate-fade-in flex items-center justify-between gap-3 rounded-md border border-primary/40 bg-primary/10 px-3 py-2"
                >
                  <span className="font-medium">{w}</span>
                  <Badge variant={i === 0 ? "default" : "secondary"}>#{i + 1}</Badge>
                </div>
              ))
            )}
          </div>
          {winners.length > 0 && <CopyButton value={winners.join("\n")} label="Copy winners" />}
        </Panel>
      </div>
    </ToolShell>
  );
}

/* ------------------------------------------------------------ base64 */

export function Base64Tool() {
  const [input, setInput] = React.useState("DarkUniverse Hub");
  const [direction, setDirection] = React.useState<"encode" | "decode">("encode");
  const { copied, copy } = useCopy();
  const { output, error } = React.useMemo(() => {
    if (!input) return { output: "", error: null as string | null };
    try {
      if (direction === "encode") {
        const bytes = new TextEncoder().encode(input);
        let binary = "";
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        return { output: btoa(binary), error: null };
      }
      const binary = atob(input.replace(/\s/g, ""));
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return { output: new TextDecoder().decode(bytes), error: null };
    } catch {
      return {
        output: "",
        error:
          direction === "decode"
            ? "That isn't valid Base64 — check for stray characters or missing padding."
            : "Could not encode this input.",
      };
    }
  }, [input, direction]);

  return (
    <ToolShell
      title="Base64 encode & decode"
      description="Unicode-safe in both directions — emoji and non-Latin text round-trip correctly."
      aside={<InfoCard>Base64 is encoding, not encryption. Never use it to protect secrets.</InfoCard>}
    >
      <Panel>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={direction === "encode" ? "default" : "outline"}
            onClick={() => setDirection("encode")}
          >
            Encode
          </Button>
          <Button
            size="sm"
            variant={direction === "decode" ? "default" : "outline"}
            onClick={() => setDirection("decode")}
          >
            Decode
          </Button>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={direction === "encode" ? "Plain text" : "Base64 input"}>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            className="font-mono text-xs"
            placeholder={direction === "decode" ? "SGVsbG8gd29ybGQ=" : "Text to encode"}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setInput("")} disabled={!input}>
              Clear
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDirection((d) => (d === "encode" ? "decode" : "encode"));
                setInput(output);
              }}
              disabled={!output}
            >
              Swap →
            </Button>
          </div>
        </Panel>

        <Panel
          title={direction === "encode" ? "Base64 output" : "Decoded text"}
          actions={
            <Button size="sm" onClick={() => copy(output)} disabled={!output}>
              {copied ? <Check /> : null}
              {copied ? "Copied" : "Copy"}
            </Button>
          }
        >
          {error ? (
            <Alert variant="destructive">{error}</Alert>
          ) : (
            <>
              <Textarea
                value={output}
                readOnly
                rows={10}
                className="font-mono text-xs"
              />
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{output.length} characters</span>
                <span>{new Blob([output]).size} bytes</span>
              </div>
            </>
          )}
        </Panel>
      </div>
    </ToolShell>
  );
}
