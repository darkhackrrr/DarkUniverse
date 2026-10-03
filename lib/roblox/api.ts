/**
 * Low-level Roblox public API client.
 *
 * All calls are made server-side from route handlers so nothing sensitive is
 * ever shipped to the browser. Roblox's public endpoints require no API key;
 * ROBLOX_API_KEY (if set) is forwarded for Open Cloud endpoints.
 */

export const ROBLOX_ENDPOINTS = {
  users: "https://users.roblox.com",
  avatar: "https://avatar.roblox.com",
  thumbnails: "https://thumbnails.roblox.com",
  groups: "https://groups.roblox.com",
  games: "https://games.roblox.com",
  presence: "https://presence.roblox.com",
  apis: "https://apis.roblox.com",
  catalog: "https://catalog.roblox.com",
} as const;

export class RobloxApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "RobloxApiError";
    this.status = status;
  }
}

interface RobloxErrorResponse {
  errors?: Array<{ code?: number; message?: string }>;
}

async function request<T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = 12_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(init.headers as Record<string, string> | undefined),
    };
    if (process.env.ROBLOX_API_KEY && !headers["x-api-key"]) {
      headers["x-api-key"] = process.env.ROBLOX_API_KEY;
    }

    const res = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      let message = `Roblox API returned ${res.status}`;
      try {
        const body = (await res.json()) as RobloxErrorResponse;
        message = body.errors?.[0]?.message || message;
      } catch {
        /* non-JSON error body */
      }
      throw new RobloxApiError(message, res.status);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof RobloxApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new RobloxApiError("Roblox API request timed out.", 504);
    }
    throw new RobloxApiError("Could not reach the Roblox API.", 502);
  } finally {
    clearTimeout(timer);
  }
}

export const robloxGet = <T>(path: string, base?: string): Promise<T> =>
  request<T>(`${base ?? ROBLOX_ENDPOINTS.users}${path}`);

export const robloxPost = <T>(
  path: string,
  body: unknown,
  base?: string,
): Promise<T> =>
  request<T>(`${base ?? ROBLOX_ENDPOINTS.users}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// ── Types ───────────────────────────────────────────────────────────────────

export interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
  about: string;
  created: string;
  isBanned: boolean;
  hasVerifiedBadge: boolean;
}

export interface UsernameLookup {
  requestedUsername: string;
  hasVerifiedBadge: boolean;
  id: number;
  name: string;
  displayName: string;
}

export interface RobloxGroup {
  id: number;
  name: string;
  description: string;
  owner: { userId: number; username: string; displayName: string } | null;
  shout: { body: string; poster?: { username: string } } | null;
  memberCount: number;
  publicEntryAllowed: boolean;
  hasVerifiedBadge: boolean;
}

export interface RobloxGameDetail {
  id: number;
  rootPlaceId: number;
  name: string;
  description: string;
  creator: { id: number; name: string; type: string; hasVerifiedBadge?: boolean };
  playing: number;
  visits: number;
  favoritedCount?: number;
  maxPlayers: number;
  created: string;
  updated: string;
  genre: string;
}

export interface ThumbnailData {
  targetId: number;
  state: string;
  imageUrl: string | null;
  error?: string | null;
}

export type PresenceType = 0 | 1 | 2 | 3 | 4 | 5;

export interface UserPresence {
  userPresenceType: PresenceType;
  lastLocation: string;
  placeId: number | null;
  rootPlaceId: number | null;
  gameId: string | null;
  universeId: number | null;
  userId: number;
  lastOnline?: string;
}

// ── Endpoints ───────────────────────────────────────────────────────────────

export async function lookupUsernames(
  usernames: string[],
): Promise<UsernameLookup[]> {
  const res = await robloxPost<{ data: UsernameLookup[] }>(
    "/v1/usernames/users",
    { usernames, excludeBannedUsers: false },
  );
  return res.data ?? [];
}

export async function getUser(userId: number): Promise<RobloxUser> {
  return robloxGet<RobloxUser>(`/v1/users/${userId}`);
}

export async function resolveUsername(
  username: string,
): Promise<UsernameLookup | null> {
  const [match] = await lookupUsernames([username]);
  return match ?? null;
}

export async function getUserAvatarAssets(userId: number) {
  const res = await robloxGet<{ assets: Array<{ id: number; name: string; type: string }> }>(
    `/v1/users/${userId}/avatar`,
    ROBLOX_ENDPOINTS.avatar,
  );
  return res.assets ?? [];
}

export async function getOutfits(userId: number, rows = 12) {
  return robloxGet<{
    data: Array<{ id: number; name: string; edited: string; imageURL?: string }>;
    total: number;
  }>(`/v1/users/${userId}/outfits?pageIndex=0&rowsPerPage=${rows}`, ROBLOX_ENDPOINTS.avatar);
}

export async function getUsernameHistory(userId: number) {
  const res = await robloxGet<{ data: Array<{ name: string; created: string }> }>(
    `/v1/users/${userId}/username-history?pageIndex=0&rowsPerPage=25`,
  );
  return res.data ?? [];
}

export async function getGroup(groupId: number): Promise<RobloxGroup> {
  return robloxGet<RobloxGroup>(`/v1/groups/${groupId}`, ROBLOX_ENDPOINTS.groups);
}

export async function getGroupMembership(groupId: number, userId: number) {
  return robloxGet<{ role: { id: number; name: string; rank: number } }>(
    `/v1/groups/${groupId}/users/${userId}`,
    ROBLOX_ENDPOINTS.groups,
  );
}

export async function placeToUniverse(placeId: number): Promise<number | null> {
  try {
    const res = await robloxGet<{ universeId: number }>(
      `/v1/places/${placeId}/universe`,
      ROBLOX_ENDPOINTS.apis,
    );
    return res.universeId ?? null;
  } catch {
    return null;
  }
}

export async function getGames(universeIds: number[]): Promise<RobloxGameDetail[]> {
  if (universeIds.length === 0) return [];
  const res = await robloxGet<{ data: RobloxGameDetail[] }>(
    `/v1/games?universeIds=${universeIds.join(",")}`,
    ROBLOX_ENDPOINTS.games,
  );
  return res.data ?? [];
}

export async function getUniverseVotes(universeIds: number[]) {
  if (universeIds.length === 0) return [];
  const res = await robloxGet<{
    data: Array<{ id: number; upVotes: number; downVotes: number }>;
  }>(`/v1/games/votes?universeIds=${universeIds.join(",")}`, ROBLOX_ENDPOINTS.games);
  return res.data ?? [];
}

export async function getUserThumbnails(
  userIds: number[],
  kind: "avatar" | "headshot" | "bust" = "avatar",
  size = "720x720",
): Promise<ThumbnailData[]> {
  const endpoint =
    kind === "headshot"
      ? "/v1/users/avatar-headshot"
      : kind === "bust"
        ? "/v1/users/avatar-bust"
        : "/v1/users/avatar";
  const res = await robloxGet<{ data: ThumbnailData[] }>(
    `${endpoint}?userIds=${userIds.join(",")}&size=${size}&format=Png&isCircular=false`,
    ROBLOX_ENDPOINTS.thumbnails,
  );
  return res.data ?? [];
}

export async function getGameThumbnails(universeIds: number[], count = 5) {
  const res = await robloxGet<{
    data: Array<{
      universeId: number;
      error: string | null;
      thumbnails: ThumbnailData[];
    }>;
  }>(
    `/v1/games/multiget/thumbnails?universeIds=${universeIds.join(",")}&size=768x432&format=Png&countsPerUniverse=${count}&defaults=true`,
    ROBLOX_ENDPOINTS.thumbnails,
  );
  return res.data ?? [];
}

export async function getGameIcons(placeIds: number[], size = "512x512") {
  const res = await robloxGet<{ data: ThumbnailData[] }>(
    `/v1/places/gameicons?placeIds=${placeIds.join(",")}&size=${size}&format=Png&isCircular=false`,
    ROBLOX_ENDPOINTS.thumbnails,
  );
  return res.data ?? [];
}

export async function getGroupIcons(groupIds: number[], size = "150x150") {
  const res = await robloxGet<{ data: ThumbnailData[] }>(
    `/v1/groups/icons?groupIds=${groupIds.join(",")}&size=${size}&format=Png&isCircular=false`,
    ROBLOX_ENDPOINTS.thumbnails,
  );
  return res.data ?? [];
}

export async function getAssetThumbnails(assetIds: number[], size = "420x420") {
  const res = await robloxGet<{ data: ThumbnailData[] }>(
    `/v1/assets?assetIds=${assetIds.join(",")}&size=${size}&format=Png&isCircular=false`,
    ROBLOX_ENDPOINTS.thumbnails,
  );
  return res.data ?? [];
}

export async function getPresence(userIds: number[]): Promise<UserPresence[]> {
  const res = await robloxPost<{ userPresences: UserPresence[] }>(
    "/v1/presence/users",
    { userIds },
    ROBLOX_ENDPOINTS.presence,
  );
  return res.userPresences ?? [];
}

/** Health probe used by the Server Status tool. */
export async function probeEndpoint(name: string, url: string) {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    return {
      name,
      url,
      ok: res.ok,
      status: res.status,
      latencyMs: Date.now() - started,
      error: res.ok ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      name,
      url,
      ok: false,
      status: 0,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : "Request failed",
    };
  }
}
