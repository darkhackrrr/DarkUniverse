"use client";

import * as React from "react";
import { Shuffle, Sparkles, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  ToolShell,
  Field,
  Panel,
  InfoCard,
  CopyButton,
} from "@/components/tools/tool-shell";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------ username generator */

const PRESETS = [
  {
    id: "clean",
    label: "Clean",
    build: (base: string) => [base, `${base}x`, `${base}_`],
  },
  {
    id: "gaming",
    label: "Gaming",
    build: (base: string) => [
      `${base}zz`,
      `${base}xv`,
      `x${base}`,
      `${base}plays`,
      `${base}yt`,
    ],
  },
  {
    id: "aesthetic",
    label: "Aesthetic",
    build: (base: string) => [
      `${base}._`,
      `_${base}`,
      `${base}v2`,
      `${base}lx`,
      `${base}vx`,
    ],
  },
  {
    id: "pro",
    label: "Competitive",
    build: (base: string) => [
      `${base}fn`,
      `${base}cs`,
      `${base}rl`,
      `${base}swe`,
      `ii${base}`,
    ],
  },
] as const;

export function UsernameGenerator() {
  const [seed, setSeed] = React.useState("darkuniverse");
  const [preset, setPreset] = React.useState<string>("clean");
  const [results, setResults] = React.useState<string[]>([]);
  const [copiedAll, setCopiedAll] = React.useState(false);

  const slugBase = seed
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 14);

  const generate = React.useCallback(() => {
    const p = PRESETS.find((x) => x.id === preset) ?? PRESETS[0];
    const base = slugBase || "player";
    const list = p.build(base);
    const extras = [
      `${base}${Math.floor(Math.random() * 90 + 10)}`,
      `${base}${["tv", "gg", "hd", "og"][Math.floor(Math.random() * 4)]}`,
      `${base}ly`,
    ];
    setResults([...new Set([...list, ...extras])].slice(0, 10));
  }, [preset, slugBase]);

  React.useEffect(() => {
    generate();
  }, [generate]);

  const copyAll = async () => {
    await navigator.clipboard.writeText(results.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1600);
  };

  return (
    <ToolShell
      title="Generate usernames"
      description="Builds clean, available-style handles from a keyword — sorted by length so short names come first."
      aside={
        <InfoCard>
          Roblox usernames must be 3–20 characters and only contain letters,
          numbers and one underscore. We strip everything else automatically.
        </InfoCard>
      }
    >
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Keyword" htmlFor="uq">
            <Input
              id="uq"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="e.g. darkuniverse"
              maxLength={20}
            />
          </Field>
          <Field label="Style" htmlFor="preset">
            <Select id="preset" value={preset} onChange={(e) => setPreset(e.target.value)}>
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex gap-2">
          <Button onClick={generate}>
            <Shuffle /> Generate again
          </Button>
          <Button variant="outline" onClick={copyAll}>
            {copiedAll ? <Check /> : <Plus />} {copiedAll ? "Copied" : "Copy all"}
          </Button>
        </div>
      </Panel>

      <Panel title="Suggestions" description="Tap to copy one.">
        <div className="grid gap-2 sm:grid-cols-2">
          {results.map((name) => (
            <div
              key={name}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3.5 py-2.5"
            >
              <span className="truncate font-mono text-sm">{name}</span>
              <span className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">{name.length}</Badge>
                <CopyButton value={name} label="Copy" />
              </span>
            </div>
          ))}
        </div>
        {slugBase.length > 14 && (
          <p className="text-xs text-muted-foreground">
            Keyword trimmed to 14 characters to keep results inside Roblox&apos;s
            20-character limit.
          </p>
        )}
      </Panel>
    </ToolShell>
  );
}

/* -------------------------------------------------------- bio generator */

const BIO_TONES = [
  { id: "chill", label: "Chill", template: (k: string[]) => `${k[0] ?? "Just here"} · ${k[1] ?? "gaming"} · ${k[2] ?? "say hi"} ✌️` },
  { id: "hype", label: "Hype", template: (k: string[]) => `${k[0] ?? "GOATED"} ${k[1] ?? "grinder"} 🚀 ${k[2] ?? "new videos"} every week` },
  { id: "pro", label: "Professional", template: (k: string[]) => `${k[0] ?? "Developer"} & ${k[1] ?? "creator"} — ${k[2] ?? "building in public"}. DMs open.` },
  { id: "mystery", label: "Mystery", template: (k: string[]) => `${k[0] ?? "void"} · ${k[1] ?? "unknown"} · ${k[2] ?? "100% real"} 👁️` },
] as const;

export function DiscordBioGenerator() {
  const [keywords, setKeywords] = React.useState("roblox, editing, music");
  const [tone, setTone] = React.useState<string>("chill");
  const [bio, setBio] = React.useState("");

  const keys = keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 6);

  const generate = React.useCallback(() => {
    const t = BIO_TONES.find((x) => x.id === tone) ?? BIO_TONES[0];
    setBio(t.template(keys));
  }, [tone, keys]);

  React.useEffect(() => {
    generate();
  }, [generate]);

  const over = bio.length > 190;

  return (
    <ToolShell
      title="Write a Discord bio"
      description="Composes a short bio from your keywords and keeps you inside Discord's 190-character limit."
      aside={<InfoCard>Discord profiles show a maximum of 190 characters. Anything longer is cut off mid-word.</InfoCard>}
    >
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Keywords (comma separated)" htmlFor="bio-keys">
            <Input
              id="bio-keys"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="roblox, editing, music"
            />
          </Field>
          <Field label="Tone" htmlFor="bio-tone">
            <Select id="bio-tone" value={tone} onChange={(e) => setTone(e.target.value)}>
              {BIO_TONES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Button onClick={generate}>
          <Sparkles /> Regenerate
        </Button>
      </Panel>

      <Panel
        title="Your bio"
        actions={<CopyButton value={bio} label="Copy bio" />}
      >
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-xs",
              over ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {bio.length}/190 characters
          </span>
          {over && <Badge variant="destructive">Too long for Discord</Badge>}
        </div>
      </Panel>
    </ToolShell>
  );
}

/* ------------------------------------------ game description formatter */

const DESCRIPTION_TEMPLATE = `🗺️ ABOUT THIS EXPERIENCE
[Write a short hook that tells players what they'll do in the first 10 seconds.]

✅ KEY FEATURES
• Feature one
• Feature two
• Feature three

🎮 HOW TO PLAY
1. Step one
2. Step two
3. Step three

🔔 UPDATES
Follow the group / bookmark the game so you never miss an update.

💬 JOIN THE COMMUNITY
Discord: [your invite link]
YouTube: [your channel link]

Thanks for playing — leave a like if you enjoyed it!`;

export function RobloxGameDescriptionFormatter() {
  const [text, setText] = React.useState(DESCRIPTION_TEMPLATE);

  const stats = React.useMemo(() => {
    const chars = text.length;
    const lines = text.split("\n");
    const bulletCount = lines.filter((l) => /^[•\-*]\s|^\d+\.\s/.test(l.trim())).length;
    return { chars, lines: lines.length, bullets: bulletCount };
  }, [text]);

  const actions = {
    uppercaseFirst: () =>
      setText((t) =>
        t.replace(/(^|\n)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase()),
      ),
    tidy: () =>
      setText((t) =>
        t
          .split("\n")
          .map((l) => l.replace(/\s+$/g, ""))
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim(),
      ),
    addSections: () =>
      setText((t) => `${t.trim()}\n\n📌 SERVER INFO\n• Max players: [n]\n• Playtime: [n]`),
  };

  return (
    <ToolShell
      title="Structure a game description"
      description="Start from a proven layout, then trim anything that doesn't help a new player decide to hit Play."
      aside={
        <InfoCard>
          Roblox renders line breaks and emoji in descriptions but ignores HTML
          — keep it to plain text, bullets and emoji.
        </InfoCard>
      }
    >
      <Panel>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={actions.tidy}>
            Tidy spacing
          </Button>
          <Button size="sm" variant="outline" onClick={actions.uppercaseFirst}>
            Capitalise headings
          </Button>
          <Button size="sm" variant="outline" onClick={actions.addSections}>
            + Server info block
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setText(DESCRIPTION_TEMPLATE)}>
            Reset template
          </Button>
        </div>
      </Panel>

      <Panel
        title="Description"
        actions={<CopyButton value={text} label="Copy description" />}
      >
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={20} className="font-mono text-xs leading-relaxed" />
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>{stats.chars} characters</span>
          <span>{stats.lines} lines</span>
          <span>{stats.bullets} list items</span>
        </div>
      </Panel>
    </ToolShell>
  );
}

/* ---------------------------------------------------------- text formatter */

type TextAction = "trim" | "spaces" | "lines" | "sort" | "dedupe" | "upper" | "lower" | "title" | "sentence";

const ACTIONS: Array<{ id: TextAction; label: string }> = [
  { id: "trim", label: "Trim each line" },
  { id: "spaces", label: "Collapse extra spaces" },
  { id: "lines", label: "Remove blank lines" },
  { id: "sort", label: "Sort lines A→Z" },
  { id: "dedupe", label: "Remove duplicates" },
  { id: "upper", label: "UPPERCASE" },
  { id: "lower", label: "lowercase" },
  { id: "title", label: "Title Case" },
  { id: "sentence", label: "Sentence case" },
];

function applyAction(text: string, action: TextAction): string {
  const lines = text.split("\n");
  switch (action) {
    case "trim":
      return lines.map((l) => l.trim()).join("\n");
    case "spaces":
      return lines.map((l) => l.replace(/[ \t]{2,}/g, " ")).join("\n");
    case "lines":
      return lines.filter((l) => l.trim() !== "").join("\n");
    case "sort":
      return [...lines].sort((a, b) => a.localeCompare(b)).join("\n");
    case "dedupe": {
      const seen = new Set<string>();
      return lines
        .filter((l) => {
          const key = l.trim().toLowerCase();
          if (!key) return true;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .join("\n");
    }
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return lines
        .map((l) =>
          l.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()),
        )
        .join("\n");
    case "sentence":
      return lines
        .map((l) => {
          const t = l.toLowerCase();
          return t ? t[0].toUpperCase() + t.slice(1) : t;
        })
        .join("\n");
    default:
      return text;
  }
}

export function TextFormatter() {
  const [input, setInput] = React.useState("");
  const [history, setHistory] = React.useState<string[]>([]);
  const output = history.length > 0 ? history[history.length - 1] : input;

  const run = (action: TextAction) => {
    const next = applyAction(output, action);
    setHistory((h) => [...h, next].slice(-50));
    setInput(next);
  };

  const undo = () => {
    setHistory((h) => {
      const next = h.slice(0, -1);
      setInput(next.length > 0 ? next[next.length - 1] : "");
      return next;
    });
  };

  const stats = {
    chars: output.length,
    words: output.split(/\s+/).filter(Boolean).length,
    lines: output.split("\n").length,
  };

  return (
    <ToolShell
      title="Clean up text"
      description="Stack as many transformations as you like — every step is undoable."
      aside={<InfoCard>Everything runs locally in your browser; nothing is sent to a server.</InfoCard>}
    >
      <Panel title="Input" actions={<span className="text-xs text-muted-foreground">{stats.chars} chars</span>}>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          placeholder="Paste text to clean up…"
        />
      </Panel>

      <Panel
        title="Actions"
        actions={
          <Button size="sm" variant="ghost" onClick={undo} disabled={history.length === 0}>
            Undo
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <Button key={a.id} size="sm" variant="outline" onClick={() => run(a.id)}>
              {a.label}
            </Button>
          ))}
        </div>
      </Panel>

      <Panel
        title="Output"
        actions={<CopyButton value={output} label="Copy result" />}
      >
        <Textarea value={output} onChange={(e) => setInput(e.target.value)} rows={8} />
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>{stats.chars} characters</span>
          <span>{stats.words} words</span>
          <span>{stats.lines} lines</span>
          <span>{history.length} step{history.length === 1 ? "" : "s"}</span>
        </div>
      </Panel>
    </ToolShell>
  );
}

/* -------------------------------------------------- colour palette */

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) =>
    ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}

export function ColorPaletteGenerator() {
  const [hue, setHue] = React.useState(262);
  const [mode, setMode] = React.useState<"analogous" | "triadic" | "complementary" | "mono">("analogous");
  const [baseLight, setBaseLight] = React.useState(62);

  const palette = React.useMemo(() => {
    const offsets =
      mode === "analogous"
        ? [-30, -15, 0, 15, 30]
        : mode === "triadic"
          ? [0, 120, 240, 0, 120]
          : mode === "complementary"
            ? [0, 180, 0, 180, 0]
            : [0, 0, 0, 0, 0];
    const lights =
      mode === "mono"
        ? [baseLight, baseLight - 15, baseLight - 30, baseLight - 45, 20]
        : [baseLight, baseLight - 8, baseLight - 16, baseLight - 24, baseLight - 32];
    return offsets.map((off, i) => ({
      name: ["Base", "Secondary", "Accent", "Highlight", "Depth"][i],
      hex: hslToHex(((hue + off) % 360 + 360) % 360, mode === "mono" ? 18 : 72, Math.max(12, lights[i])),
      hue: ((hue + off) % 360 + 360) % 360,
    }));
  }, [hue, mode, baseLight]);

  const css = `:root {\n${palette.map((c) => `  --${c.name.toLowerCase()}: ${c.hex};`).join("\n")}\n}`;

  return (
    <ToolShell
      title="Build a colour palette"
      description="Pick a base hue and a harmony, then export the CSS variables."
      aside={<InfoCard>Contrast is checked against the darkest tone so body text stays readable.</InfoCard>}
    >
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Base hue — ${hue}°`} htmlFor="hue">
            <input
              id="hue"
              type="range"
              min={0}
              max={359}
              value={hue}
              onChange={(e) => setHue(Number(e.target.value))}
              className="w-full accent-[var(--color-primary)]"
            />
          </Field>
          <Field label={`Base lightness — ${baseLight}%`} htmlFor="light">
            <input
              id="light"
              type="range"
              min={25}
              max={85}
              value={baseLight}
              onChange={(e) => setBaseLight(Number(e.target.value))}
              className="w-full accent-[var(--color-primary)]"
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["analogous", "triadic", "complementary", "mono"] as const).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? "default" : "outline"}
              onClick={() => setMode(m)}
            >
              {m[0].toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </div>
      </Panel>

      <Panel title="Palette" actions={<CopyButton value={css} label="Copy CSS" />}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {palette.map((c) => (
            <div key={c.name} className="overflow-hidden rounded-lg border border-border">
              <div className="h-20" style={{ background: c.hex }} />
              <div className="space-y-1 bg-surface p-2.5">
                <p className="text-xs font-medium">{c.name}</p>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[0.7rem] text-muted-foreground">{c.hex}</span>
                  <CopyButton value={c.hex} label="Copy" size="sm" variant="ghost" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <pre className="overflow-auto rounded-lg border border-border bg-[#1e1f22] p-3 text-xs text-[#b5bac1]">
          {css}
        </pre>
      </Panel>
    </ToolShell>
  );
}

/* ---------------------------------------------------------- gradient */

export function GradientGenerator() {
  const [type, setType] = React.useState<"linear" | "radial" | "conic">("linear");
  const [angle, setAngle] = React.useState(135);
  const [from, setFrom] = React.useState("#7C6CF5");
  const [to, setTo] = React.useState("#0A0A0C");
  const [stops, setStops] = React.useState<Array<{ color: string; at: number }>>([]);

  const gradient = React.useMemo(() => {
    const parts = [
      { color: from, at: 0 },
      ...stops,
      { color: to, at: 100 },
    ]
      .sort((a, b) => a.at - b.at)
      .map((s) => `${s.color} ${s.at}%`)
      .join(", ");
    if (type === "linear") return `linear-gradient(${angle}deg, ${parts})`;
    if (type === "radial") return `radial-gradient(circle at 50% 50%, ${parts})`;
    return `conic-gradient(from ${angle}deg at 50% 50%, ${parts})`;
  }, [type, angle, from, to, stops]);

  const css = `background: ${gradient};`;

  return (
    <ToolShell
      title="Craft CSS gradients"
      description="Live preview with stop control — copy the one-liner straight into your stylesheet."
      aside={<InfoCard>Add extra stops for multi-colour blends. Angles apply to linear and conic gradients.</InfoCard>}
    >
      <Panel>
        <div className="flex gap-2">
          {(["linear", "radial", "conic"] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={type === t ? "default" : "outline"}
              onClick={() => setType(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start colour" htmlFor="g-from">
            <div className="flex gap-2">
              <input
                type="color"
                value={from}
                onChange={(e) => setFrom(e.target.value.toUpperCase())}
                className="h-9 w-12 cursor-pointer rounded border border-input bg-background"
                aria-label="Start colour"
              />
              <Input id="g-from" value={from} onChange={(e) => setFrom(e.target.value)} className="font-mono" />
            </div>
          </Field>
          <Field label="End colour" htmlFor="g-to">
            <div className="flex gap-2">
              <input
                type="color"
                value={to}
                onChange={(e) => setTo(e.target.value.toUpperCase())}
                className="h-9 w-12 cursor-pointer rounded border border-input bg-background"
                aria-label="End colour"
              />
              <Input id="g-to" value={to} onChange={(e) => setTo(e.target.value)} className="font-mono" />
            </div>
          </Field>
        </div>

        <Field label={`Angle — ${angle}°`} htmlFor="g-angle">
          <input
            id="g-angle"
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-full accent-[var(--color-primary)]"
            disabled={type === "radial"}
          />
        </Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Extra stops</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStops((s) => [...s, { color: "#FFFFFF", at: 50 }])}
            >
              <Plus /> Add stop
            </Button>
          </div>
          {stops.map((stop, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={stop.color}
                onChange={(e) =>
                  setStops((s) => s.map((x, idx) => (idx === i ? { ...x, color: e.target.value.toUpperCase() } : x)))
                }
                className="h-9 w-10 cursor-pointer rounded border border-input bg-background"
                aria-label={`Stop ${i + 1} colour`}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={stop.at}
                onChange={(e) =>
                  setStops((s) => s.map((x, idx) => (idx === i ? { ...x, at: Number(e.target.value) } : x)))
                }
                className="flex-1 accent-[var(--color-primary)]"
                aria-label={`Stop ${i + 1} position`}
              />
              <span className="w-10 text-right font-mono text-xs text-muted-foreground">{stop.at}%</span>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setStops((s) => s.filter((_, idx) => idx !== i))}
                aria-label="Remove stop"
              >
                <Trash2 className="text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Preview" actions={<CopyButton value={css} label="Copy CSS" />}>
        <div
          className="h-48 rounded-lg border border-border"
          style={{ background: gradient }}
          role="img"
          aria-label="Gradient preview"
        />
        <pre className="overflow-auto rounded-lg border border-border bg-[#1e1f22] p-3 text-xs text-[#b5bac1]">
          {css}
        </pre>
      </Panel>
    </ToolShell>
  );
}

/* ------------------------------------------------------ YouTube title */

const TITLE_PATTERNS = [
  (t: string) => `${t} (You Won't Believe This)`,
  (t: string) => `${t} — Full Guide`,
  (t: string) => `How ${t} Actually Works`,
  (t: string) => `${t}: Everything New`,
  (t: string) => `I Tried ${t} So You Don't Have To`,
  (t: string) => `${t} — The Ultimate Breakdown`,
];

export function YoutubeTitleGenerator() {
  const [topic, setTopic] = React.useState("");
  const [titles, setTitles] = React.useState<string[]>([]);
  const [selected, setSelected] = React.useState("");

  const generate = () => {
    const base = topic.trim() || "this update";
    const list = TITLE_PATTERNS.map((p) => p(base));
    setTitles([...new Set(list)]);
    setSelected(list[0]);
  };

  React.useEffect(() => {
    if (topic.trim()) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const len = selected.length;

  return (
    <ToolShell
      title="Generate clickable titles"
      description="YouTube allows 100 characters — but only about 70 show on desktop, fewer on mobile."
      aside={
        <InfoCard>
          Front-load the keyword: mobile viewers see roughly the first 40
          characters. We highlight titles that fit on one line.
        </InfoCard>
      }
    >
      <Panel>
        <Field label="Video topic" htmlFor="yt-topic">
          <Input
            id="yt-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Troll Tower update"
            maxLength={80}
          />
        </Field>
        <Button onClick={generate} disabled={!topic.trim()}>
          <Sparkles /> Generate titles
        </Button>
      </Panel>

      <Panel title="Suggestions">
        {titles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Enter a topic to generate title ideas.
          </p>
        ) : (
          <div className="space-y-2">
            {titles.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelected(t)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors",
                  selected === t
                    ? "border-primary/60 bg-primary/10"
                    : "border-border bg-surface hover:border-primary/40",
                )}
              >
                <span className="min-w-0 truncate text-sm">{t}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant={t.length <= 70 ? "success" : "warning"}>{t.length}</Badge>
                  <CopyButton value={t} label="Copy" />
                </span>
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Selected title" actions={<CopyButton value={selected} label="Copy title" />}>
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-lg font-semibold">
          {selected || "Pick a suggestion above."}
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className={len > 70 ? "text-warning" : "text-success"}>
            {len}/100 characters
          </span>
          <span>{len <= 70 ? "Fits on desktop without truncation" : "May be cut off on desktop"}</span>
        </div>
      </Panel>
    </ToolShell>
  );
}

/* ------------------------------------------------- description formatter */

export function YoutubeDescriptionFormatter() {
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [links, setLinks] = React.useState<Array<{ label: string; url: string }>>([
    { label: "Discord", url: "https://discord.gg/" },
    { label: "Roblox group", url: "https://www.roblox.com/share/g/291490614" },
  ]);
  const [timestamps, setTimestamps] = React.useState<Array<{ time: string; label: string }>>([
    { time: "0:00", label: "Intro" },
  ]);
  const [tags, setTags] = React.useState("");
  const [social, setSocial] = React.useState(true);

  const description = React.useMemo(() => {
    const parts: string[] = [];
    if (summary.trim()) parts.push(summary.trim());
    if (timestamps.length > 0) {
      parts.push("⏱️ TIMESTAMPS");
      parts.push(timestamps.map((t) => `${t.time} ${t.label}`).join("\n"));
    }
    if (links.some((l) => l.url.trim())) {
      parts.push("🔗 LINKS");
      parts.push(
        links
          .filter((l) => l.url.trim())
          .map((l) => `${l.label}: ${l.url}`)
          .join("\n"),
      );
    }
    if (tags.trim()) {
      parts.push("🏷️ TAGS");
      parts.push(tags.split(",").map((t) => `#${t.trim().replace(/\s+/g, "")}`).filter((t) => t !== "#").join(" "));
    }
    if (social) {
      parts.push(
        "👍 Like, 💬 Comment and 🔔 Subscribe for more.\nBusiness email: contact@darkuniverse.example",
      );
    }
    return parts.join("\n\n");
  }, [summary, timestamps, links, tags, social]);

  const tagCount = tags.split(",").filter((t) => t.trim()).length;
  const tagChars = tags.replace(/\s/g, "").length;

  return (
    <ToolShell
      title="Structured video descriptions"
      description="Timestamps, links, tags and a call to action — assembled in the order viewers actually read."
      aside={
        <InfoCard>
          Description limit is 5,000 characters. The first 150 characters show
          in search results, so put the hook first.
        </InfoCard>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Panel title="Basics">
            <Field label="Video title" htmlFor="yd-title">
              <Input id="yd-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Used in the preview" />
            </Field>
            <Field label="Summary / hook (shown in search)" htmlFor="yd-summary">
              <Textarea
                id="yd-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                placeholder="What happens in this video, in one or two sentences."
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={social}
                onChange={(e) => setSocial(e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              Include like / subscribe call to action
            </label>
          </Panel>

          <Panel
            title="Timestamps"
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTimestamps((t) => [...t, { time: "0:00", label: "" }])}
              >
                <Plus /> Add
              </Button>
            }
          >
            {timestamps.length === 0 && (
              <p className="text-sm text-muted-foreground">No chapters yet.</p>
            )}
            <div className="space-y-2">
              {timestamps.map((ts, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={ts.time}
                    onChange={(e) =>
                      setTimestamps((list) => list.map((x, idx) => (idx === i ? { ...x, time: e.target.value } : x)))
                    }
                    className="w-24 font-mono"
                    placeholder="1:23"
                  />
                  <Input
                    value={ts.label}
                    onChange={(e) =>
                      setTimestamps((list) => list.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))
                    }
                    placeholder="Chapter title"
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setTimestamps((list) => list.filter((_, idx) => idx !== i))}
                    aria-label="Remove chapter"
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Chapters must start at 0:00 and each segment needs at least 10
              seconds for YouTube to activate them.
            </p>
          </Panel>

          <Panel
            title="Links"
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => setLinks((l) => [...l, { label: "", url: "" }])}
              >
                <Plus /> Add
              </Button>
            }
          >
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={link.label}
                    onChange={(e) =>
                      setLinks((list) => list.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))
                    }
                    placeholder="Label"
                    className="w-32"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) =>
                      setLinks((list) => list.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))
                    }
                    placeholder="https://…"
                  />
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setLinks((list) => list.filter((_, idx) => idx !== i))}
                    aria-label="Remove link"
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Tags line">
            <Field label="Comma-separated tags" htmlFor="yd-tags">
              <Textarea
                id="yd-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                rows={3}
                placeholder="roblox, troll tower, update"
              />
            </Field>
            <div className="flex gap-4 text-xs">
              <span className="text-muted-foreground">{tagCount} tags</span>
              <span className={tagChars > 400 ? "text-warning" : "text-muted-foreground"}>
                {tagChars}/500 tag characters
              </span>
            </div>
          </Panel>
        </div>

        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Panel title="Preview" actions={<CopyButton value={description} label="Copy description" />}>
            <p className="mb-2 font-semibold">{title || "Your video title"}</p>
            <Textarea value={description} readOnly rows={20} className="font-mono text-xs leading-relaxed" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{description.length}/5000 characters</span>
              <span>{description.split("\n")[0].length}/150 in search snippet</span>
            </div>
          </Panel>
        </div>
      </div>
    </ToolShell>
  );
}

/* ------------------------------------------------------------ tags */

const TAG_SEEDS: Record<string, string[]> = {
  roblox: ["roblox", "roblox gameplay", "roblox games", "roblox 2026", "roblox update", "roblox tutorial"],
  youtube: ["youtube", "youtube growth", "content creator", "video editing", "youtube tips"],
  discord: ["discord", "discord server", "discord bots", "discord setup", "community"],
};

export function YoutubeTagsGenerator() {
  const [topic, setTopic] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);

  const generate = () => {
    const base = topic
      .toLowerCase()
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const seeds = Object.values(TAG_SEEDS).flat();
    const generated = [
      ...base,
      ...base.map((b) => `${b} guide`),
      ...base.map((b) => `${b} 2026`),
      ...base.map((b) => `how to ${b}`),
      ...seeds.filter((s) => base.some((b) => s.includes(b))),
      ...seeds.slice(0, 6),
    ];
    const unique = [...new Set(generated.map((t) => t.trim()).filter(Boolean))].slice(0, 30);
    setTags(unique);
  };

  React.useEffect(() => {
    if (topic.trim()) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  const used = tags.join(",").replace(/\s+/g, " ").trim();

  return (
    <ToolShell
      title="Build a tag set"
      description="Generates up to 30 relevant tags and keeps you under YouTube's 500-character budget."
      aside={
        <InfoCard>
          Tags have a small effect on discovery — titles, thumbnails and the
          first 150 characters of the description matter far more.
        </InfoCard>
      }
    >
      <Panel>
        <Field label="Topic (comma separated keywords)" htmlFor="tags-topic">
          <Input
            id="tags-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. troll tower, obby"
          />
        </Field>
        <Button onClick={generate} disabled={!topic.trim()}>
          <Sparkles /> Generate tags
        </Button>
      </Panel>

      <Panel
        title={`Tags (${tags.length})`}
        actions={<CopyButton value={used} label="Copy all tags" />}
      >
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Enter a topic to generate tags.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs"
              >
                {t}
                <button
                  type="button"
                  onClick={() => setTags((list) => list.filter((x) => x !== t))}
                  aria-label={`Remove ${t}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {used.length}/500 characters used
          </span>
          <Button size="sm" variant="ghost" onClick={() => setTags([])} disabled={tags.length === 0}>
            <Trash2 /> Clear
          </Button>
        </div>
      </Panel>
    </ToolShell>
  );
}
