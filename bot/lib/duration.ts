const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

/** Parses "10m", "1h30m", "2d", "90s" → milliseconds, or null if invalid. */
export function parseDuration(input: string): number | null {
  const text = input.trim().toLowerCase().replace(/\s+/g, "");
  if (!text) return null;
  const pattern = /(\d+(?:\.\d+)?)(ms|s|m|h|d|w)/g;
  let total = 0;
  let matched = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    total += Number(match[1]) * UNIT_MS[match[2]];
    matched += match[0].length;
  }
  if (matched !== text.length || total <= 0) return null;
  return total;
}

export function formatDuration(ms: number): string {
  const units: [number, string][] = [
    [604_800_000, "w"],
    [86_400_000, "d"],
    [3_600_000, "h"],
    [60_000, "m"],
    [1000, "s"],
  ];
  const parts: string[] = [];
  let rest = Math.max(0, Math.floor(ms / 1000) * 1000);
  for (const [size, label] of units) {
    if (rest >= size) {
      const count = Math.floor(rest / size);
      rest -= count * size;
      parts.push(`${count}${label}`);
    }
    if (parts.length === 2) break;
  }
  return parts.length ? parts.join(" ") : "0s";
}
