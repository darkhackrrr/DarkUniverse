"use client";

import * as React from "react";
import { Upload, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import {
  ToolShell,
  Field,
  Panel,
  InfoCard,
  CopyButton,
  KeyValue,
} from "@/components/tools/tool-shell";
import { formatBytes } from "@/lib/utils";

/* --------------------------------------------------------- shared bits */

interface Loaded {
  file: File;
  url: string;
  width: number;
  height: number;
  image: HTMLImageElement;
}

function useImageLoader() {
  const [loaded, setLoaded] = React.useState<Loaded | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image. Use PNG, JPEG, WebP or GIF.");
      setLoaded(null);
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError("Image is larger than 30 MB — pick a smaller file.");
      setLoaded(null);
      return;
    }
    setLoading(true);
    setError(null);
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setLoaded({
        file,
        url,
        width: image.naturalWidth,
        height: image.naturalHeight,
        image,
      });
      setLoading(false);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Could not decode that image.");
      setLoading(false);
    };
    image.src = url;
  }, []);

  const clear = React.useCallback(() => {
    setLoaded((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setError(null);
  }, []);

  return { loaded, error, loading, load, clear };
}

function FileDrop({
  onFile,
  label = "Drop an image here or click to browse",
}: {
  onFile: (file: File) => void;
  label?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
        dragging
          ? "border-primary bg-primary/10"
          : "border-border bg-surface hover:border-primary/40"
      }`}
    >
      <Upload className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">
        Processed entirely in your browser — nothing is uploaded.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Preview({ loaded }: { loaded: Loaded }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      { }
      <img src={loaded.url} alt={loaded.file.name} className="max-h-96 w-full object-contain" />
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

function extFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "img";
}

/* ----------------------------------------------------------- resizer */

export function ImageResizer() {
  const { loaded, error, loading, load, clear } = useImageLoader();
  const [mode, setMode] = React.useState<"exact" | "percent">("percent");
  const [percent, setPercent] = React.useState(50);
  const [width, setWidth] = React.useState(0);
  const [height, setHeight] = React.useState(0);
  const [keepRatio, setKeepRatio] = React.useState(true);
  const [result, setResult] = React.useState<{ blob: Blob; url: string; w: number; h: number } | null>(null);

  React.useEffect(() => {
    if (loaded) {
      setWidth(Math.round(loaded.width * (percent / 100)));
      setHeight(Math.round(loaded.height * (percent / 100)));
    }
     
  }, [loaded, percent]);

  const target = React.useMemo(() => {
    if (!loaded) return null;
    if (mode === "percent") {
      return {
        w: Math.max(1, Math.round((loaded.width * percent) / 100)),
        h: Math.max(1, Math.round((loaded.height * percent) / 100)),
      };
    }
    return { w: Math.max(1, width), h: Math.max(1, height) };
  }, [loaded, mode, percent, width, height]);

  const resize = async () => {
    if (!loaded || !target) return;
    const canvas = document.createElement("canvas");
    canvas.width = target.w;
    canvas.height = target.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(loaded.image, 0, 0, target.w, target.h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, loaded.file.type || "image/png", 0.95),
    );
    if (!blob) return;
    if (result) URL.revokeObjectURL(result.url);
    setResult({ blob, url: URL.createObjectURL(blob), w: target.w, h: target.h });
  };

  return (
    <ToolShell
      title="Resize an image"
      description="Scale to an exact pixel size or a percentage — high-quality resampling, all local."
      aside={<InfoCard>The original file is never modified. Your browser does the work, so huge images stay private.</InfoCard>}
    >
      {!loaded ? (
        <FileDrop onFile={load} />
      ) : (
        <>
          {error && <Alert variant="destructive">{error}</Alert>}
          {loading && <p className="text-sm text-muted-foreground">Loading image…</p>}
          <Panel
            title={loaded.file.name}
            description={`${loaded.width} × ${loaded.height}px · ${formatBytes(loaded.file.size)}`}
            actions={
              <Button size="sm" variant="ghost" onClick={() => { clear(); setResult(null); }}>
                <RotateCcw /> Choose another
              </Button>
            }
          >
            <Preview loaded={loaded} />
          </Panel>

          <Panel title="Resize settings">
            <div className="flex gap-2">
              <Button size="sm" variant={mode === "percent" ? "default" : "outline"} onClick={() => setMode("percent")}>
                Percentage
              </Button>
              <Button size="sm" variant={mode === "exact" ? "default" : "outline"} onClick={() => setMode("exact")}>
                Exact pixels
              </Button>
            </div>

            {mode === "percent" ? (
              <Field label={`Scale — ${percent}%`} htmlFor="scale">
                <input
                  id="scale"
                  type="range"
                  min={1}
                  max={400}
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)]"
                />
              </Field>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Width (px)" htmlFor="rw">
                  <Input
                    id="rw"
                    type="number"
                    min={1}
                    value={width}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      setWidth(w);
                      if (keepRatio && loaded) setHeight(Math.max(1, Math.round((w / loaded.width) * loaded.height)));
                    }}
                  />
                </Field>
                <Field label="Height (px)" htmlFor="rh">
                  <Input
                    id="rh"
                    type="number"
                    min={1}
                    value={height}
                    onChange={(e) => {
                      const h = Number(e.target.value);
                      setHeight(h);
                      if (keepRatio && loaded) setWidth(Math.max(1, Math.round((h / loaded.height) * loaded.width)));
                    }}
                  />
                </Field>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={keepRatio}
                onChange={(e) => setKeepRatio(e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              Lock aspect ratio
            </label>

            <div className="flex items-center gap-3">
              <Button onClick={resize} disabled={!target}>
                Resize
              </Button>
              {target && (
                <span className="text-sm text-muted-foreground">
                  Output: {target.w} × {target.h}px
                </span>
              )}
            </div>
          </Panel>

          {result && (
            <Panel
              title="Result"
              description={`${result.w} × ${result.h}px · ${formatBytes(result.blob.size)}`}
              actions={
                <Button
                  size="sm"
                  onClick={() =>
                    downloadBlob(
                      result.blob,
                      `${baseName(loaded.file.name)}-${result.w}x${result.h}.${extFor(result.blob.type)}`,
                    )
                  }
                >
                  <Download /> Download
                </Button>
              }
            >
              { }
              <img src={result.url} alt="Resized result" className="max-h-96 w-full rounded-lg border border-border object-contain" />
            </Panel>
          )}
        </>
      )}
      {error && !loaded && <Alert variant="destructive">{error}</Alert>}
    </ToolShell>
  );
}

/* ------------------------------------------------------------ cropper */

export function ImageCropper() {
  const { loaded, error, load, clear } = useImageLoader();
  const [sel, setSel] = React.useState({ x: 0, y: 0, w: 100, h: 100 });
  const [result, setResult] = React.useState<{ url: string; blob: Blob } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef<{ mode: "move" | "new"; ox: number; oy: number } | null>(null);

  React.useEffect(() => {
    if (loaded) {
      setSel({
        x: Math.round(loaded.width * 0.1),
        y: Math.round(loaded.height * 0.1),
        w: Math.round(loaded.width * 0.8),
        h: Math.round(loaded.height * 0.8),
      });
      setResult(null);
    }
  }, [loaded]);

  const percent = React.useMemo(
    () =>
      loaded
        ? {
            x: (sel.x / loaded.width) * 100,
            y: (sel.y / loaded.height) * 100,
            w: (sel.w / loaded.width) * 100,
            h: (sel.h / loaded.height) * 100,
          }
        : null,
    [loaded, sel],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (!loaded || !percent) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * loaded.width;
    const py = ((e.clientY - rect.top) / rect.height) * loaded.height;
    const inside =
      px >= sel.x && px <= sel.x + sel.w && py >= sel.y && py <= sel.y + sel.h;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    if (inside) {
      dragging.current = { mode: "move", ox: px - sel.x, oy: py - sel.y };
    } else {
      dragging.current = { mode: "new", ox: px, oy: py };
      setSel({ x: Math.round(px), y: Math.round(py), w: 1, h: 1 });
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || !loaded) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = Math.min(
      loaded.width,
      Math.max(0, ((e.clientX - rect.left) / rect.width) * loaded.width),
    );
    const py = Math.min(
      loaded.height,
      Math.max(0, ((e.clientY - rect.top) / rect.height) * loaded.height),
    );
    if (dragging.current.mode === "move") {
      const nx = Math.min(
        loaded.width - sel.w,
        Math.max(0, px - dragging.current.ox),
      );
      const ny = Math.min(
        loaded.height - sel.h,
        Math.max(0, py - dragging.current.oy),
      );
      setSel((s) => ({ ...s, x: Math.round(nx), y: Math.round(ny) }));
    } else {
      const x0 = dragging.current.ox;
      const y0 = dragging.current.oy;
      setSel({
        x: Math.round(Math.min(x0, px)),
        y: Math.round(Math.min(y0, py)),
        w: Math.round(Math.abs(px - x0)),
        h: Math.round(Math.abs(py - y0)),
      });
    }
  };

  const onPointerUp = () => {
    dragging.current = null;
    setSel((s) => {
      const w = Math.max(8, s.w);
      const h = Math.max(8, s.h);
      return loaded
        ? {
            x: Math.min(s.x, loaded.width - w),
            y: Math.min(s.y, loaded.height - h),
            w,
            h,
          }
        : s;
    });
  };

  const crop = async () => {
    if (!loaded) return;
    const canvas = document.createElement("canvas");
    canvas.width = sel.w;
    canvas.height = sel.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(loaded.image, sel.x, sel.y, sel.w, sel.h, 0, 0, sel.w, sel.h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, loaded.file.type === "image/gif" ? "image/png" : loaded.file.type || "image/png"),
    );
    if (!blob) return;
    if (result) URL.revokeObjectURL(result.url);
    setResult({ blob, url: URL.createObjectURL(blob) });
  };

  const update = (key: "x" | "y" | "w" | "h", value: number) => {
    if (!loaded) return;
    setSel((s) => {
      const next = { ...s, [key]: value };
      next.w = Math.max(8, Math.min(next.w, loaded.width - next.x));
      next.h = Math.max(8, Math.min(next.h, loaded.height - next.y));
      next.x = Math.max(0, Math.min(next.x, loaded.width - next.w));
      next.y = Math.max(0, Math.min(next.y, loaded.height - next.h));
      return next;
    });
  };

  return (
    <ToolShell
      title="Crop an image"
      description="Drag a new box directly on the preview, or type exact pixel values."
      aside={<InfoCard>Drag inside the box to move it; drag outside to draw a fresh selection.</InfoCard>}
    >
      {!loaded ? (
        <FileDrop onFile={load} />
      ) : (
        <>
          {error && <Alert variant="destructive">{error}</Alert>}
          <Panel
            title="Selection"
            description={`${loaded.width} × ${loaded.height}px original`}
            actions={
              <Button size="sm" variant="ghost" onClick={() => { clear(); setResult(null); }}>
                <RotateCcw /> Another image
              </Button>
            }
          >
            <div
              ref={containerRef}
              className="relative touch-none select-none overflow-hidden rounded-lg border border-border bg-surface"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
            >
              { }
              <img src={loaded.url} alt="Crop preview" className="block w-full select-none" draggable={false} />
              {percent && (
                <>
                  <div
                    className="pointer-events-none absolute inset-0 bg-black/55"
                    style={{
                      clipPath: `polygon(0% 0%, 0% 100%, ${percent.x}% 100%, ${percent.x}% ${percent.y}%, ${percent.x + percent.w}% ${percent.y}%, ${percent.x + percent.w}% ${percent.y + percent.h}%, ${percent.x}% ${percent.y + percent.h}%, ${percent.x}% 0%)`,
                    }}
                  />
                  <div
                    className="pointer-events-none absolute cursor-move border-2 border-primary"
                    style={{
                      left: `${percent.x}%`,
                      top: `${percent.y}%`,
                      width: `${percent.w}%`,
                      height: `${percent.h}%`,
                      boxShadow: "0 0 0 9999px transparent",
                    }}
                  />
                </>
              )}
            </div>
          </Panel>

          <Panel title="Exact values (pixels)">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="X" htmlFor="cx">
                <Input id="cx" type="number" value={sel.x} onChange={(e) => update("x", Number(e.target.value))} />
              </Field>
              <Field label="Y" htmlFor="cy">
                <Input id="cy" type="number" value={sel.y} onChange={(e) => update("y", Number(e.target.value))} />
              </Field>
              <Field label="Width" htmlFor="cw">
                <Input id="cw" type="number" value={sel.w} onChange={(e) => update("w", Number(e.target.value))} />
              </Field>
              <Field label="Height" htmlFor="ch">
                <Input id="ch" type="number" value={sel.h} onChange={(e) => update("h", Number(e.target.value))} />
              </Field>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={crop} disabled={sel.w < 8 || sel.h < 8}>
                Crop
              </Button>
              <span className="text-sm text-muted-foreground">
                {sel.w} × {sel.h}px selected
              </span>
            </div>
          </Panel>

          {result && (
            <Panel
              title="Cropped result"
              actions={
                <Button
                  size="sm"
                  onClick={() =>
                    downloadBlob(result.blob, `${baseName(loaded.file.name)}-crop.${extFor(result.blob.type)}`)
                  }
                >
                  <Download /> Download
                </Button>
              }
            >
              { }
              <img src={result.url} alt="Cropped result" className="max-h-96 w-full rounded-lg border border-border object-contain" />
            </Panel>
          )}
        </>
      )}
      {error && !loaded && <Alert variant="destructive">{error}</Alert>}
    </ToolShell>
  );
}

/* --------------------------------------------------------- compressor */

export function ImageCompressor() {
  const { loaded, error, load, clear } = useImageLoader();
  const [quality, setQuality] = React.useState(75);
  const [format, setFormat] = React.useState<"original" | "image/jpeg" | "image/webp" | "image/png">("original");
  const [result, setResult] = React.useState<{ blob: Blob; url: string } | null>(null);

  const outputType = React.useMemo(() => {
    if (format !== "original") return format;
    const t = loaded?.file.type;
    if (t === "image/jpeg" || t === "image/webp" || t === "image/png") return t;
    return "image/jpeg";
  }, [format, loaded]);

  const compress = async () => {
    if (!loaded) return;
    const canvas = document.createElement("canvas");
    canvas.width = loaded.width;
    canvas.height = loaded.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (outputType === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(loaded.image, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, quality / 100),
    );
    if (!blob) return;
    if (result) URL.revokeObjectURL(result.url);
    setResult({ blob, url: URL.createObjectURL(blob) });
  };

  const saved = result
    ? Math.round((1 - result.blob.size / loaded!.file.size) * 100)
    : 0;

  return (
    <ToolShell
      title="Compress an image"
      description="Re-encodes at a quality you choose and reports exactly how much you saved."
      aside={
        <InfoCard>
          JPEG is best for photos, WebP for the smallest size. PNG stays lossless
          so the quality slider won&apos;t shrink it much.
        </InfoCard>
      }
    >
      {!loaded ? (
        <FileDrop onFile={load} />
      ) : (
        <>
          {error && <Alert variant="destructive">{error}</Alert>}
          <Panel
            title={loaded.file.name}
            description={`${loaded.width} × ${loaded.height}px · ${formatBytes(loaded.file.size)}`}
            actions={
              <Button size="sm" variant="ghost" onClick={() => { clear(); setResult(null); }}>
                <RotateCcw /> Another image
              </Button>
            }
          >
            <Preview loaded={loaded} />
          </Panel>

          <Panel title="Compression">
            <Field label="Output format" htmlFor="cfmt">
              <select
                id="cfmt"
                value={format}
                onChange={(e) => setFormat(e.target.value as typeof format)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="original">Same as source</option>
                <option value="image/jpeg">JPEG (smallest photos)</option>
                <option value="image/webp">WebP (smallest overall)</option>
                <option value="image/png">PNG (lossless)</option>
              </select>
            </Field>
            <Field label={`Quality — ${quality}%`} htmlFor="cq">
              <Slider
                id="cq"
                min={10}
                max={100}
                step={5}
                value={[quality]}
                onValueChange={(v) => setQuality(v[0])}
              />
            </Field>
            <Button onClick={compress}>Compress</Button>
          </Panel>

          {result && (
            <Panel
              title="Result"
              description={
                saved > 0
                  ? `${formatBytes(result.blob.size)} — ${saved}% smaller`
                  : `${formatBytes(result.blob.size)} — larger than the original`
              }
              actions={
                <Button
                  size="sm"
                  onClick={() =>
                    downloadBlob(
                      result.blob,
                      `${baseName(loaded.file.name)}-compressed.${extFor(result.blob.type)}`,
                    )
                  }
                >
                  <Download /> Download
                </Button>
              }
            >
              <KeyValue
                items={[
                  { label: "Original", value: formatBytes(loaded.file.size) },
                  { label: "Compressed", value: formatBytes(result.blob.size) },
                  {
                    label: "Change",
                    value: `${saved > 0 ? "−" : "+"}${Math.abs(saved)}%`,
                  },
                  { label: "Format", value: result.blob.type.replace("image/", "").toUpperCase() },
                ]}
              />
              { }
              <img src={result.url} alt="Compressed preview" className="max-h-80 w-full rounded-lg border border-border object-contain" />
            </Panel>
          )}
        </>
      )}
      {error && !loaded && <Alert variant="destructive">{error}</Alert>}
    </ToolShell>
  );
}

/* ---------------------------------------------------------- converter */

export function ImageConverter() {
  const { loaded, error, load, clear } = useImageLoader();
  const [target, setTarget] = React.useState<"image/png" | "image/jpeg" | "image/webp">("image/webp");
  const [quality, setQuality] = React.useState(92);
  const [bg, setBg] = React.useState("#ffffff");
  const [result, setResult] = React.useState<{ blob: Blob; url: string } | null>(null);

  const convert = async () => {
    if (!loaded) return;
    const canvas = document.createElement("canvas");
    canvas.width = loaded.width;
    canvas.height = loaded.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (target === "image/jpeg") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(loaded.image, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, target, quality / 100),
    );
    if (!blob) return;
    if (result) URL.revokeObjectURL(result.url);
    setResult({ blob, url: URL.createObjectURL(blob) });
  };

  return (
    <ToolShell
      title="Convert image formats"
      description="PNG ↔ JPEG ↔ WebP without uploading the file anywhere."
      aside={
        <InfoCard>
          Transparency only survives PNG and WebP — converting to JPEG flattens
          it onto a background colour.
        </InfoCard>
      }
    >
      {!loaded ? (
        <FileDrop onFile={load} />
      ) : (
        <>
          {error && <Alert variant="destructive">{error}</Alert>}
          <Panel
            title={loaded.file.name}
            description={`${loaded.file.type.replace("image/", "").toUpperCase()} · ${formatBytes(loaded.file.size)}`}
            actions={
              <Button size="sm" variant="ghost" onClick={() => { clear(); setResult(null); }}>
                <RotateCcw /> Another image
              </Button>
            }
          >
            <Preview loaded={loaded} />
          </Panel>

          <Panel title="Convert to">
            <div className="flex flex-wrap gap-2">
              {(["image/png", "image/jpeg", "image/webp"] as const).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={target === t ? "default" : "outline"}
                  onClick={() => setTarget(t)}
                >
                  {t.replace("image/", "").toUpperCase()}
                </Button>
              ))}
            </div>

            {target === "image/jpeg" && (
              <Field label="Background colour (flattens transparency)" htmlFor="bgcolor">
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bg}
                    onChange={(e) => setBg(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-input bg-background"
                    aria-label="Background colour"
                  />
                  <Input id="bgcolor" value={bg} onChange={(e) => setBg(e.target.value)} className="font-mono" />
                </div>
              </Field>
            )}

            {target !== "image/png" && (
              <Field label={`Quality — ${quality}%`} htmlFor="convq">
                <Slider
                  id="convq"
                  min={10}
                  max={100}
                  step={2}
                  value={[quality]}
                  onValueChange={(v) => setQuality(v[0])}
                />
              </Field>
            )}

            <Button onClick={convert}>Convert</Button>
          </Panel>

          {result && (
            <Panel
              title="Converted file"
              description={`${result.blob.type.replace("image/", "").toUpperCase()} · ${formatBytes(result.blob.size)}`}
              actions={
                <div className="flex gap-2">
                  <CopyButton value={URL.createObjectURL(result.blob)} label="Copy object URL" />
                  <Button
                    size="sm"
                    onClick={() =>
                      downloadBlob(
                        result.blob,
                        `${baseName(loaded.file.name)}.${extFor(result.blob.type)}`,
                      )
                    }
                  >
                    <Download /> Download
                  </Button>
                </div>
              }
            >
              { }
              <img src={result.url} alt="Converted result" className="max-h-96 w-full rounded-lg border border-border object-contain" />
            </Panel>
          )}
        </>
      )}
      {error && !loaded && <Alert variant="destructive">{error}</Alert>}
    </ToolShell>
  );
}

/* ---------------------------------------------------- dimensions viewer */

export function ImageDimensionsViewer() {
  const { loaded, error, load, clear } = useImageLoader();
  const [meta, setMeta] = React.useState<Record<string, string> | null>(null);

  React.useEffect(() => {
    if (!loaded) {
      setMeta(null);
      return;
    }
    const img = loaded.image;
    const data: Record<string, string> = {};
    // Natural colour space hint — browsers expose it via `img.colorSpace`.
    const anyImg = img as HTMLImageElement & { colorSpace?: string };
    if (anyImg.colorSpace) data["Colour space"] = anyImg.colorSpace;
    setMeta(data);
  }, [loaded]);

  return (
    <ToolShell
      title="Read image dimensions"
      description="Exact pixel width and height, orientation, aspect ratio and file size."
      aside={<InfoCard>Also useful for checking that a thumbnail really is 1920×1080 before you upload it.</InfoCard>}
    >
      {!loaded ? (
        <FileDrop onFile={load} label="Drop an image to inspect its dimensions" />
      ) : (
        <>
          {error && <Alert variant="destructive">{error}</Alert>}
          <Panel
            title={loaded.file.name}
            actions={
              <Button size="sm" variant="ghost" onClick={clear}>
                <RotateCcw /> Another image
              </Button>
            }
          >
            <Preview loaded={loaded} />
          </Panel>

          <Panel title="Details">
            <KeyValue
              items={[
                { label: "Width", value: `${loaded.width}px` },
                { label: "Height", value: `${loaded.height}px` },
                {
                  label: "Megapixels",
                  value: `${((loaded.width * loaded.height) / 1_000_000).toFixed(2)} MP`,
                },
                {
                  label: "Aspect ratio",
                  value: simplifyRatio(loaded.width, loaded.height),
                },
                {
                  label: "Orientation",
                  value:
                    loaded.width === loaded.height
                      ? "Square"
                      : loaded.width > loaded.height
                        ? "Landscape"
                        : "Portrait",
                },
                { label: "File size", value: formatBytes(loaded.file.size) },
                { label: "Type", value: loaded.file.type || "unknown" },
                { label: "Last modified", value: new Date(loaded.file.lastModified).toLocaleString() },
                ...(Object.entries(meta ?? {}).map(([k, v]) => ({ label: k, value: v }))),
              ]}
            />
            <CopyButton
              value={`${loaded.width}x${loaded.height}`}
              label="Copy WxH"
            />
          </Panel>
        </>
      )}
      {error && !loaded && <Alert variant="destructive">{error}</Alert>}
    </ToolShell>
  );
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function simplifyRatio(w: number, h: number) {
  const d = gcd(w, h);
  const rw = w / d;
  const rh = h / d;
  if (rw <= 32 && rh <= 32) return `${rw}:${rh}`;
  return `${(w / h).toFixed(2)}:1`;
}

/* --------------------------------------------------------- file size viewer */

export function FileSizeViewer() {
  const [files, setFiles] = React.useState<Array<{ name: string; size: number }>>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const add = (list: FileList | null) => {
    if (!list) return;
    setFiles((f) => [
      ...f,
      ...Array.from(list).map((file) => ({ name: file.name, size: file.size })),
    ]);
  };

  const total = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <ToolShell
      title="Inspect file sizes"
      description="See sizes in bytes, KB, MB and GB with a percentage breakdown per file."
      aside={<InfoCard>1 KB = 1,024 bytes (binary units). Some tools quote 1,000-byte kilobytes instead.</InfoCard>}
    >
      <Panel>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => inputRef.current?.click()}>
            <Upload /> Add files
          </Button>
          <Button variant="ghost" onClick={() => setFiles([])} disabled={files.length === 0}>
            Clear
          </Button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              add(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Files are read only to measure their size — they never leave your
          computer.
        </p>
      </Panel>

      <Panel title={`Files (${files.length})`}>
        {files.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No files added yet.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              {files.map((f, i) => {
                const pct = total > 0 ? (f.size / total) * 100 : 0;
                return (
                  <div key={`${f.name}-${i}`} className="rounded-lg border border-border bg-surface p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium">{f.name}</span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {formatBytes(f.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles((list) => list.filter((_, idx) => idx !== i))}
                        aria-label={`Remove ${f.name}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-3 text-[0.7rem] text-muted-foreground">
                      <span>{f.size.toLocaleString()} bytes</span>
                      <span>{(f.size / 1024).toFixed(2)} KB</span>
                      <span>{(f.size / 1024 / 1024).toFixed(3)} MB</span>
                      <span>{(f.size / 1024 / 1024 / 1024).toFixed(4)} GB</span>
                      <span>{pct.toFixed(1)}% of total</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total</span>
                <Badge variant="default">{formatBytes(total)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {total.toLocaleString()} bytes · {(total / 1024).toFixed(2)} KB ·{" "}
                {(total / 1024 / 1024).toFixed(3)} MB
              </p>
            </div>
          </div>
        )}
      </Panel>
    </ToolShell>
  );
}
