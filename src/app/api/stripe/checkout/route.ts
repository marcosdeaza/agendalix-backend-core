import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripe, priceIdForPlan } from "@/lib/stripe";
import type { Plan } from "@/lib/supabase/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sb = createSupabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { plan?: Plan };
  const plan = body.plan;
  if (!plan || plan === "trial") {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
  }
  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json({ error: "Precio no configurado" }, { status: 500 });
  }

  const admin = createSupabaseAdminClient();
  const { data: neg } = await admin
    .from("negocios")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (!neg) return NextResponse.json({ error: "negocio_not_found" }, { status: 404 });

  const appUrl = process.env.APP_URL || "https://agendalix.com";

  let customerId = neg.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email: neg.email,
      name: neg.nombre,
      metadata: { negocio_id: neg.id },
    });
    customerId = customer.id;
    await admin
      .from("negocios")
      .update({ stripe_customer_id: customerId })
      .eq("id", neg.id);
  }

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/panel?billing=ok`,
    cancel_url: `${appUrl}/panel?billing=cancel`,
    metadata: { negocio_id: neg.id, plan },
    subscription_data: { metadata: { negocio_id: neg.id, plan } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
