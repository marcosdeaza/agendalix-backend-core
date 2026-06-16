"use client";

import { motion } from "framer-motion";

export function ProgressBar({ step, total, tone = "dark" }: { step: number; total: number; tone?: "dark" | "light" }) {
  const pct = Math.min(100, Math.max(0, (step / total) * 100));
  return (
    <div className={`w-full h-[3px] overflow-hidden rounded-full ${tone === "light" ? "bg-linel" : "bg-line-subtle"}`}>
      <motion.div
        className="h-full bg-purple"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
