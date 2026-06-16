import { getCurrentNegocio } from "@/lib/panel-data";
import { PlanSelector } from "@/components/panel/PlanSelector";
import { trialDaysLeft, isTrialExpired } from "@/lib/trial";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PlanPage() {
  const negocio = await getCurrentNegocio();
  if (!negocio) return null;

  return (
    <PlanSelector
      trialExpired={isTrialExpired(negocio)}
      trialDaysLeft={trialDaysLeft(negocio)}
      currentPlan={negocio.plan}
      hasSubscription={!!negocio.stripe_subscription_id}
    />
  );
}
