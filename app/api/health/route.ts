import { prismaAvailable } from "@/lib/database/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    db: prismaAvailable(),
    time: new Date().toISOString(),
  });
}
