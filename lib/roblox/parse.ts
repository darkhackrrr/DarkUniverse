/**
 * Roblox input parsing helpers shared by the API routes.
 */

const URL_PATTERNS = [
  /roblox\.com\/games\/(\d+)/i,
  /roblox\.com\/share\?.*code=(\d+)/i,
  /roblox\.com\/users\/(\d+)/i,
  /roblox\.com\/groups\/(\d+)/i,
];

export function extractNumericId(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    const n = Number(trimmed);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  }

  for (const pattern of URL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      const n = Number(match[1]);
      if (Number.isSafeInteger(n) && n > 0) return n;
    }
  }

  return null;
}

export function isValidUsername(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 3 || trimmed.length > 20) return false;
  return /^[A-Za-z0-9_]+$/.test(trimmed);
}

export function extractInviteCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const patterns = [
    /discord(?:app)?\.com\/invite\/([A-Za-z0-9-]+)/i,
    /discord\.gg\/([A-Za-z0-9-]+)/i,
  ];
  for (const p of patterns) {
    const match = trimmed.match(p);
    if (match?.[1]) return match[1];
  }
  if (/^[A-Za-z0-9-]{2,}$/.test(trimmed)) return trimmed;
  return null;
}

export function parseRobloxGameInput(
  input: string,
): { placeId: number | null; universeId: number | null } {
  const trimmed = input.trim();

  const universeMatch = trimmed.match(/universeId=(\d+)/i);
  if (universeMatch?.[1]) {
    return { placeId: null, universeId: Number(universeMatch[1]) };
  }

  return { placeId: extractNumericId(trimmed), universeId: null };
}
