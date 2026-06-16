"use client";

import { useState } from "react";
import { Button } from "../ui/Button";
import { UpgradeModal } from "./UpgradeModal";
import type { Plan } from "@/lib/supabase/database.types";
import { UPGRADE_TARGET, PLAN_LABELS } from "@/lib/plan-features";

export function InformesGate({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false);
  const target = UPGRADE_TARGET[plan];

  return (
    <>
      <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-purple/10 border-[0.5px] border-purple/20 flex items-center justify-center text-3xl">
          📊
        </div>
        <div>
          <h2 className="text-[18px] font-medium text-white mb-1">Informes avanzados</h2>
          <p className="text-[13px] text-ink-secondary max-w-[340px]">
            Los informes completos, gráficas de rendimiento y exportación a Excel están disponibles
            {target ? (
              <>
                {" "}desde el plan{" "}
                <span className="text-purple font-medium">{PLAN_LABELS[target]}</span>.
              </>
            ) : (
              "."
            )}
          </p>
        </div>
        {target && (
          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            Ver plan {PLAN_LABELS[target]}
          </Button>
        )}
      </div>

      <UpgradeModal
        open={open}
        onClose={() => setOpen(false)}
        currentPlan={plan}
        blockedFeature="Informes avanzados"
      />
    </>
  );
}
