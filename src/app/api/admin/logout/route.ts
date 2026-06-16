import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  clearAdminCookie();
  return NextResponse.json({ ok: true });
}
