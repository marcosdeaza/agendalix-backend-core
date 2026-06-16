"use client";

import { CountUp } from "../ui/CountUp";
import { motion } from "framer-motion";

type Tone = "default" | "purple" | "green" | "yellow" | "red";

type Props = {
  label: string;
  value: number | string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  delay?: number;
  tone?: Tone;
};

const toneColor: Record<Tone, string> = {
  default: "text-white",
  purple: "text-purple-light",
  green: "text-[#8CE9A3]",
  yellow: "text-[#F2B560]",
  red: "text-[#E08383]",
};

export function StatCard({
  label,
  value,
  decimals,
  prefix,
  suffix,
  icon,
  delay = 0,
  tone = "default",
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-bg-card border-[0.5px] border-line-subtle rounded-xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] tracking-[0.14em] uppercase text-ink-muted">{label}</span>
        {icon ? <div className="opacity-70">{icon}</div> : null}
      </div>
      <div className={`text-[28px] font-medium leading-none ${toneColor[tone]}`}>
        {typeof value === "number" ? (
          <CountUp value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        ) : (
          value
        )}
      </div>
    </motion.div>
  );
}
