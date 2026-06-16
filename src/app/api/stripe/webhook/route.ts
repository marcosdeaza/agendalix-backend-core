import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { sendPaymentFailedEmail } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 500 });

  const sig = req.headers.get("stripe-signature") || "";
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const negocioId = s.metadata?.negocio_id || null;
        const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
        const custId = typeof s.customer === "string" ? s.customer : s.customer?.id;
        if (negocioId && subId) {
          const sub = await stripe().subscriptions.retrieve(subId);
          const priceId = sub.items.data[0]?.price.id;
          const plan = planFromPriceId(priceId) || "basico";
          await admin
            .from("negocios")
            .update({
              plan,
              stripe_customer_id: custId || null,
              stripe_subscription_id: subId,
              activo: true,
            })
            .eq("id", negocioId);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const negocioId =
          sub.metadata?.negocio_id ||
          (await findNegocioByCustomer(admin, typeof sub.customer === "string" ? sub.customer : sub.customer.id));
        if (!negocioId) break;
        const priceId = sub.items.data[0]?.price.id;
        const plan = planFromPriceId(priceId);
        const status = sub.status;
        const activo = status === "active" || status === "trialing";
        await admin
          .from("negocios")
          .update({
            plan: plan || undefined,
            stripe_subscription_id: sub.id,
            activo,
          })
          .eq("id", negocioId);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const negocioId =
          sub.metadata?.negocio_id ||
          (await findNegocioByCustomer(
            admin,
            typeof sub.customer === "string" ? sub.customer : sub.customer.id,
          ));
        if (!negocioId) break;
        await admin
          .from("negocios")
          .update({ plan: "trial", stripe_subscription_id: null, activo: false })
          .eq("id", negocioId);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const custId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        if (!custId) break;
        const negocioId = await findNegocioByCustomer(admin, custId);
        if (!negocioId) break;
        const { data: neg } = await admin
          .from("negocios")
          .select("email,nombre")
          .eq("id", negocioId)
          .maybeSingle();
        if (neg?.email) {
          try {
            await sendPaymentFailedEmail({ to: neg.email, nombre: neg.nombre });
          } catch (err) {
            console.error("payment_failed email", err);
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("stripe webhook handler", event.type, err);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function findNegocioByCustomer(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  customerId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("negocios")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id || null;
}
