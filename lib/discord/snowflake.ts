/**
 * Discord snowflake encoding / decoding — pure functions, client-safe.
 */

const DISCORD_EPOCH = 1_420_070_400_000n;

export interface SnowflakeParts {
  id: string;
  timestampMs: number;
  date: Date;
  workerId: number;
  processId: number;
  increment: number;
  isValid: boolean;
  error?: string;
}

export function decodeSnowflake(id: string): SnowflakeParts {
  const trimmed = id.trim();
  const empty: SnowflakeParts = {
    id: trimmed,
    timestampMs: 0,
    date: new Date(0),
    workerId: 0,
    processId: 0,
    increment: 0,
    isValid: false,
  };

  if (!trimmed) return { ...empty, error: "Enter a Discord ID." };
  if (!/^\d{17,20}$/.test(trimmed)) {
    return {
      ...empty,
      error: "Discord IDs are 17–20 digit numbers.",
    };
  }

  const value = BigInt(trimmed);
  const timestamp = Number((value >> 22n) + DISCORD_EPOCH);
  const workerId = Number((value >> 17n) & 0x1fn);
  const processId = Number((value >> 12n) & 0x1fn);
  const increment = Number(value & 0xfffn);

  if (Number.isNaN(timestamp) || timestamp <= 0) {
    return { ...empty, error: "Could not decode this ID." };
  }

  return {
    id: trimmed,
    timestampMs: timestamp,
    date: new Date(timestamp),
    workerId,
    processId,
    increment,
    isValid: true,
  };
}

/** Build a snowflake from a date (useful for testing / synthetic IDs). */
export function encodeSnowflake(date: Date): string {
  const ms = BigInt(date.getTime()) - DISCORD_EPOCH;
  return ((ms << 22n) | (0n << 17n) | (0n << 12n) | 1n).toString();
}
