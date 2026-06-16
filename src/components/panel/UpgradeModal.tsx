"use client";

import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import type { Plan } from "@/lib/supabase/database.types";
import { PLAN_FEATURES_LIST, PLAN_LABELS, PLAN_PRICES, UPGRADE_TARGET } from "@/lib/plan-features";

type Props = {
  open: boolean;
  onClose: () => void;
  currentPlan: Plan;
  blockedFeature?: string;
};

export function UpgradeModal({ open, onClose, currentPlan, blockedFeature }: Props) {
  const target = UPGRADE_TARGET[currentPlan] ?? "clinica";
  const features = PLAN_FEATURES_LIST[target];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mejora tu plan"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Ahora no
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              window.location.href = "/panel/plan";
            }}
          >
            Ver planes y mejorar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {blockedFeature && (
          <p className="text-[13px] text-ink-secondary">
            <span className="text-white font-medium">{blockedFeature}</span> está disponible desde
            el plan{" "}
            <span className="text-purple font-medium">{PLAN_LABELS[target as Plan]}</span>.
          </p>
        )}

        <div className="bg-bg-card2 rounded-xl p-4 border-[0.5px] border-line-subtle">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium text-[15px]">
              Plan {PLAN_LABELS[target as Plan]}
            </span>
            <span className="text-purple font-medium">{PLAN_PRICES[target as Plan]}</span>
          </div>
          <ul className="space-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-[13px] text-ink-secondary">
                <span className="text-green-400 text-[12px]">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[12px] text-ink-muted">
          Escríbenos a{" "}
          <a href="mailto:contacto@agendalix.com" className="text-purple hover:underline">
            contacto@agendalix.com
          </a>{" "}
          y te ayudamos con el cambio en menos de 24 h.
        </p>
      </div>
    </Modal>
  );
}
