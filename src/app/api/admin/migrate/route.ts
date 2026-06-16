import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One-time migration endpoint. Call POST /api/admin/migrate from the admin dashboard.
// After confirming "ok: true", this route is safe to leave in place (idempotent).
export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sb = createSupabaseAdminClient();

  // Test if the status column already exists
  const probe = await sb.from("negocios").select("status").limit(1);

  if (!probe.error) {
    // Column exists — patch any NULL rows to ACTIVE
    await sb
      .from("negocios")
      .update({ status: "ACTIVE" } as never)
      .filter("status" as never, "is", null);
    return NextResponse.json({ ok: true, msg: "Column already exists. NULL rows set to ACTIVE." });
  }

  // Column doesn't exist. Return the SQL to run in the Supabase SQL editor.
  return NextResponse.json(
    {
      ok: false,
      msg: "Run the SQL below in your Supabase SQL editor (Project → SQL Editor), then call this endpoint again.",
      sql: [
        "ALTER TABLE public.negocios ADD COLUMN IF NOT EXISTS status text DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACTIVE','REJECTED'));",
        "UPDATE public.negocios SET status = 'ACTIVE' WHERE status IS NULL;",
      ],
    },
    { status: 400 },
  );
}
