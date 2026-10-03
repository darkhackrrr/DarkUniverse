/**
 * Discord <t:...> timestamp helpers — pure functions, client-safe.
 */

export type TimestampStyle =
  | "t"
  | "T"
  | "d"
  | "D"
  | "f"
  | "F"
  | "R";

export const timestampStyles: Array<{
  style: TimestampStyle;
  label: string;
  example: (ts: number) => string;
}> = [
  { style: "t", label: "Short Time", example: (ts) => format(ts, "t") },
  { style: "T", label: "Long Time", example: (ts) => format(ts, "T") },
  { style: "d", label: "Short Date", example: (ts) => format(ts, "d") },
  { style: "D", label: "Long Date", example: (ts) => format(ts, "D") },
  { style: "f", label: "Short Date/Time", example: (ts) => format(ts, "f") },
  { style: "F", label: "Long Date/Time", example: (ts) => format(ts, "F") },
  { style: "R", label: "Relative Time", example: (ts) => format(ts, "R") },
];

const intlOptions: Record<TimestampStyle, Intl.DateTimeFormatOptions> = {
  t: { hour: "numeric", minute: "2-digit" },
  T: { hour: "numeric", minute: "2-digit", second: "2-digit" },
  d: { month: "numeric", day: "numeric", year: "numeric" },
  D: { month: "long", day: "numeric", year: "numeric" },
  f: {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
  F: {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
  R: undefined as unknown as Intl.DateTimeFormatOptions,
};

export function format(timestampSeconds: number, style: TimestampStyle): string {
  const date = new Date(timestampSeconds * 1000);
  if (style === "R") {
    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      Math.round((date.getTime() - Date.now()) / 1000),
      "second",
    );
  }
  return new Intl.DateTimeFormat("en-US", intlOptions[style]).format(date);
}

export function buildToken(timestampSeconds: number, style: TimestampStyle) {
  return `<t:${timestampSeconds}:${style}>`;
}

/** Parse an <t:unix:style> token back into parts. */
export function parseToken(
  token: string,
): { seconds: number; style: TimestampStyle } | null {
  const match = token.trim().match(/^<t:(\d{1,12}):([tdDfFRtT])>$/);
  if (!match) return null;
  return { seconds: Number(match[1]), style: match[2] as TimestampStyle };
}
