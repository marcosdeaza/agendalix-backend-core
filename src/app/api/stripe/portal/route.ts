import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const sb = createSupabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data: neg } = await admin
    .from("negocios")
    .select("stripe_customer_id")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!neg?.stripe_customer_id) {
    return NextResponse.json({ error: "sin_suscripcion" }, { status: 400 });
  }

  const appUrl = process.env.APP_URL || "https://agendalix.com";
  const portal = await stripe().billingPortal.sessions.create({
    customer: neg.stripe_customer_id,
    return_url: `${appUrl}/panel`,
  });
  return NextResponse.json({ url: portal.url });
}
