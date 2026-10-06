const DEFAULT_TIMEOUT = 8000;

export async function getJson<T>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    signal: AbortSignal.timeout(timeoutMs ?? DEFAULT_TIMEOUT),
    headers: {
      accept: "application/json",
      "user-agent": "DarkUniverseBot/1.0 (+https://darkuniverse-hub.vercel.app)",
      ...rest.headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

export async function getText(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<string> {
  const { timeoutMs, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    signal: AbortSignal.timeout(timeoutMs ?? DEFAULT_TIMEOUT),
    headers: {
      "user-agent": "DarkUniverseBot/1.0 (+https://darkuniverse-hub.vercel.app)",
      ...rest.headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}
