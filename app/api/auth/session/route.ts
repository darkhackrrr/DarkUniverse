import { getCurrentUser } from "@/lib/auth/session";
import { isOAuthConfigured, isDatabaseConfigured } from "@/lib/config";
import { jsonOk } from "@/lib/api/helpers";

export const runtime = "nodejs";

/** GET /api/auth/session → current session (or null). */
export async function GET() {
  const user = await getCurrentUser();
  return jsonOk({
    user,
    oauthConfigured: isOAuthConfigured(),
    databaseConfigured: isDatabaseConfigured(),
  });
}
