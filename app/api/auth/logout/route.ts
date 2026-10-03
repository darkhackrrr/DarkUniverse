import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await destroySession();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

export async function GET(request: NextRequest) {
  await destroySession();
  return NextResponse.redirect(new URL("/", request.url));
}
