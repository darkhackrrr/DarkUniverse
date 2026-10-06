import { randomInt } from "node:crypto";
import { getPrisma } from "@/lib/database/client";

export const VERIFY_TTL_MS = 10 * 60 * 1000;
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export interface VerifyStatus {
  database: boolean;
  verified: boolean;
  code: string | null;
}

export interface VerifyUser {
  id: string;
  discordId: string | null;
}

/**
 * Maps a session user onto their database row. Sessions created while the
 * database was unavailable carry a synthetic `local_*` id that will no longer
 * match — fall back to the Discord id so verification still works until the
 * user signs in again.
 */
async function resolveDbUserId(user: VerifyUser): Promise<string | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  try {
    const byId = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    });
    if (byId) return byId.id;
    if (user.discordId) {
      const byDiscord = await prisma.user.findUnique({
        where: { discordId: user.discordId },
        select: { id: true },
      });
      if (byDiscord) return byDiscord.id;
    }
  } catch {
    return null;
  }
  return null;
}

function makeCode(): string {
  let out = "";
  for (let i = 0; i < 6; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export async function readVerifyStatus(user: VerifyUser): Promise<VerifyStatus> {
  const prisma = getPrisma();
  if (!prisma) return { database: false, verified: false, code: null };

  try {
    const id = await resolveDbUserId(user);
    if (!id) return { database: true, verified: false, code: null };
    const row = await prisma.user.findUnique({
      where: { id },
      select: { isBotVerified: true, verifyCode: true, verifyExpiresAt: true },
    });
    if (!row) return { database: true, verified: false, code: null };
    const active = Boolean(
      row.verifyCode &&
        row.verifyExpiresAt &&
        row.verifyExpiresAt.getTime() > Date.now(),
    );
    return {
      database: true,
      verified: row.isBotVerified,
      code: active ? row.verifyCode : null,
    };
  } catch {
    return { database: true, verified: false, code: null };
  }
}

export async function issueVerifyCode(
  user: VerifyUser,
): Promise<{ code: string; expiresIn: number } | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const id = await resolveDbUserId(user);
  if (!id) return null;

  const code = makeCode();
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MS);
  await prisma.user.update({
    where: { id },
    data: { verifyCode: code, verifyExpiresAt: expiresAt },
  });
  return { code, expiresIn: VERIFY_TTL_MS / 1000 };
}

export async function clearVerifyCode(user: VerifyUser): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  const id = await resolveDbUserId(user);
  if (!id) return;
  await prisma.user.update({
    where: { id },
    data: { verifyCode: null, verifyExpiresAt: null },
  });
}
