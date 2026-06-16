import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { getAllNegocios } from "@/lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const data = await getAllNegocios();
  return NextResponse.json({ negocios: data });
}
