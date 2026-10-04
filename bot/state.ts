import { getPrisma } from "@/lib/database/client";

export async function readState(key: string): Promise<string | null> {
  const prisma = getPrisma();
  if (!prisma) return null;
  const row = await prisma.botState.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function writeState(key: string, value: string): Promise<void> {
  const prisma = getPrisma();
  if (!prisma) return;
  await prisma.botState.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
