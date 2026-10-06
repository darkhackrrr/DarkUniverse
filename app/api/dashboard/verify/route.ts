import { AuthError, requireUser } from "@/lib/auth/session";
import { getPrisma } from "@/lib/database/client";
import { jsonError, jsonOk, serverError } from "@/lib/api/helpers";
import { guardRateLimit } from "@/lib/api/guard";
import {
  clearVerifyCode,
  issueVerifyCode,
  readVerifyStatus,
} from "@/lib/verify";

export const runtime = "nodejs";

async function signedIn() {
  try {
    return await requireUser();
  } catch (error) {
    if (error instanceof AuthError) return null;
    throw error;
  }
}

export async function GET(request: Request) {
  const limited = guardRateLimit(request, "verify:read", 30);
  if (limited) return limited;

  const user = await signedIn();
  if (!user) return jsonError("Sign in to use Discord verification.", 401);

  if (!getPrisma()) return jsonOk({ database: false, verified: false, code: null });
  return jsonOk(await readVerifyStatus(user));
}

export async function POST(request: Request) {
  const limited = guardRateLimit(request, "verify:issue", 10);
  if (limited) return limited;

  const user = await signedIn();
  if (!user) return jsonError("Sign in to use Discord verification.", 401);

  if (!getPrisma()) {
    return jsonError("Verification needs a configured database.", 503);
  }

  try {
    const issued = await issueVerifyCode(user);
    if (!issued) return serverError("Could not create a verification code.");
    return jsonOk(issued);
  } catch (error) {
    console.error("[verify] issue failed:", error);
    return serverError("Could not create a verification code.");
  }
}

export async function DELETE(request: Request) {
  const limited = guardRateLimit(request, "verify:clear", 10);
  if (limited) return limited;

  const user = await signedIn();
  if (!user) return jsonError("Sign in to use Discord verification.", 401);

  try {
    await clearVerifyCode(user);
    return jsonOk({ cleared: true });
  } catch (error) {
    console.error("[verify] clear failed:", error);
    return serverError("Could not clear your code.");
  }
}
