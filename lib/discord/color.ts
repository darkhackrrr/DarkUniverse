/**
 * Discord embed colour conversion utilities — pure functions, client-safe.
 */

export interface ColorParts {
  r: number;
  g: number;
  b: number;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function normalizeHex(input: string): string | null {
  let v = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(v)) {
    v = v
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return null;
  return v.toUpperCase();
}

export function hexToRgb(hex: string): ColorParts | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: ColorParts): string {
  const toHex = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/** Discord embed colour as a decimal integer. */
export function rgbToInt({ r, g, b }: ColorParts): number {
  return clamp(Math.round(r), 0, 255) * 65536 +
    clamp(Math.round(g), 0, 255) * 256 +
    clamp(Math.round(b), 0, 255);
}

export function intToRgb(value: number): ColorParts {
  const v = clamp(Math.round(value), 0, 0xffffff);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

export function rgbToHsl({ r, g, b }: ColorParts): {
  h: number;
  s: number;
  l: number;
} {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
    else if (max === gn) h = ((bn - rn) / d + 2) * 60;
    else h = ((rn - gn) / d + 4) * 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hueToRgb(p: number, q: number, tRaw: number): number {
  let t = tRaw;
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export function hslToRgb(h: number, s: number, l: number): ColorParts {
  const hn = ((h % 360) + 360) % 360 / 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v };
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  return {
    r: Math.round(hueToRgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, hn) * 255),
    b: Math.round(hueToRgb(p, q, hn - 1 / 3) * 255),
  };
}

export const discordPalette: Array<{ name: string; hex: string }> = [
  { name: "Blurple", hex: "5865F2" },
  { name: "Greyple", hex: "99AAB5" },
  { name: "Dark But Not Black", hex: "2C2F33" },
  { name: "Not Quite Black", hex: "23272A" },
  { name: "Green", hex: "57F287" },
  { name: "Yellow", hex: "FEE75C" },
  { name: "Fuchsia", hex: "EB459E" },
  { name: "Red", hex: "ED4245" },
  { name: "White", hex: "FFFFFF" },
];
