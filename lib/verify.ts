import { randomInt } from "node:crypto";
import { getPrisma } from "@/lib/database/client";

export const VERIFY_TTL_MS = 10 * 60 * 1000;
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export interface VerifyStatus {
  database: boolean;
  verified: boolean;
  code: string | null;
}

function makeCode(): string {
  let out = "";
  for (let i = 0; i < 6; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

export async function readVerifyStatus(userId: string): Promise<VerifyStatus> {
  const prisma = getPrisma();
  if (!prisma) return { database: false, verified: false, code: null };

  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
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
  userId: string,
): Promise<{ code: string; expiresIn: number } | null> {
  const prisma = getPrisma();
  if (!prisma) return null;

  const code = makeCode();
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MS);
  await prisma.user.update({
    where: { id: userId },
    data: { verifyCode: code, verifyExpiresAt: expiresAt },
  });
  return { code, expiresIn: VERIFY_TTL_MS / 1000 };
}

export async function clearVerifyCode(userId: string): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  await prisma.user.update({
    where: { id: userId },
    data: { verifyCode: null, verifyExpiresAt: null },
  });
}
