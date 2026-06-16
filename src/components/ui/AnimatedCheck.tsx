"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AnimatedCheck({ size = 88 }: { size?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 88 88"
      fill="none"
      aria-hidden="true"
    >
      <motion.circle
        cx="44"
        cy="44"
        r="40"
        stroke="#2E8F66"
        strokeWidth="2"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M28 45l12 12 22-24"
        stroke="#2E8F66"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
