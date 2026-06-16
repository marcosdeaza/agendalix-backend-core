"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Marca Agendalix v7 — «el tiempo que florece».
 * Esfera de reloj a las 10:10 (la hora que sonríe) con la minutera en ámbar
 * (la cita) y un brote de dos hojas naciendo arriba: el tiempo que Agendalix
 * te devuelve. Fondo transparente; misma geometría exacta que favicon/iconos.
 */

type LogoProps = {
  variant?: "mark" | "full" | "compact";
  /** Altura total renderizada en px. */
  size?: number;
  animate?: boolean;
  className?: string;
  ariaLabel?: string;
  /** "dark" = sobre fondo oscuro (panel), "light" = sobre papel (landing). */
  tone?: "dark" | "light";
};

const EASE = [0.22, 1, 0.36, 1] as const;

const M = {
  cx: 60.0, cy: 67.8, r: 35.4, ring: 8.16, hand: 5.52, pivot: 4.32, stem: 5.04,
  hx: 51.86, hy: 53.7,
  mx: 71.68, my: 47.57,
  stemY1: 34.03, stemY2: 23.76,
  leafGreen: "60.00,24.24 59.90,23.28 59.80,22.33 59.68,21.39 59.54,20.48 59.37,19.59 59.17,18.73 58.93,17.92 58.64,17.14 58.31,16.41 57.92,15.73 57.48,15.11 56.98,14.54 56.43,14.02 55.82,13.55 55.16,13.14 54.44,12.78 53.68,12.47 52.87,12.19 52.02,11.96 51.14,11.76 50.23,11.58 49.30,11.43 48.35,11.29 47.40,11.16 47.40,11.16 47.50,12.12 47.60,13.07 47.72,14.01 47.86,14.92 48.03,15.81 48.23,16.67 48.47,17.48 48.76,18.26 49.09,18.99 49.48,19.67 49.92,20.29 50.42,20.86 50.97,21.38 51.58,21.85 52.24,22.26 52.96,22.62 53.72,22.93 54.53,23.21 55.38,23.44 56.26,23.64 57.17,23.82 58.10,23.97 59.05,24.11 60.00,24.24",
  leafAmber: "60.00,24.24 60.95,24.11 61.90,23.97 62.83,23.82 63.74,23.64 64.62,23.44 65.47,23.21 66.28,22.93 67.04,22.62 67.76,22.26 68.42,21.85 69.03,21.38 69.58,20.86 70.08,20.29 70.52,19.67 70.91,18.99 71.24,18.26 71.53,17.48 71.77,16.67 71.97,15.81 72.14,14.92 72.28,14.01 72.40,13.07 72.50,12.12 72.60,11.16 72.60,11.16 71.65,11.29 70.70,11.43 69.77,11.58 68.86,11.76 67.98,11.96 67.13,12.19 66.32,12.47 65.56,12.78 64.84,13.14 64.18,13.55 63.57,14.02 63.02,14.54 62.52,15.11 62.08,15.73 61.69,16.41 61.36,17.14 61.07,17.92 60.83,18.73 60.63,19.59 60.46,20.48 60.32,21.39 60.20,22.33 60.10,23.28 60.00,24.24",
};

export function Logo({
  variant = "full",
  size = 32,
  animate = false,
  className = "",
  ariaLabel = "Agendalix",
  tone = "dark",
}: LogoProps) {
  const reduce = useReducedMotion();
  const shouldAnimate = animate && !reduce;

  const green = tone === "light" ? "#14503A" : "#3DA57A";
  const amber = "#D9912B";
  const word = tone === "light" ? "#201C12" : "#ffffff";
  const tag = tone === "light" ? "#8B8470" : "#777777";

  const geom =
    variant === "mark"
      ? { vbW: 120, vbH: 120, wordmark: false, tagline: false, fontSize: 0, gap: 0 }
      : variant === "compact"
        ? { vbW: 425, vbH: 120, wordmark: true, tagline: false, fontSize: 60, gap: 16 }
        : { vbW: 470, vbH: 132, wordmark: true, tagline: true, fontSize: 60, gap: 16 };

  const aspect = geom.vbW / geom.vbH;
  const width = Math.round(size * aspect);

  const wordX = 120 + geom.gap;
  const wordY = variant === "full" ? 78 : 84;

  const Mark = (
    <g>
      <circle cx={M.cx} cy={M.cy} r={M.r} fill="none" stroke={green} strokeWidth={M.ring} />
      <line x1={M.cx} y1={M.cy} x2={M.hx} y2={M.hy} stroke={green} strokeWidth={M.hand} strokeLinecap="round" />
      {shouldAnimate ? (
        <motion.line
          x1={M.cx} y1={M.cy} x2={M.mx} y2={M.my}
          stroke={amber} strokeWidth={M.hand} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, delay: 0.3, ease: EASE }}
        />
      ) : (
        <line x1={M.cx} y1={M.cy} x2={M.mx} y2={M.my} stroke={amber} strokeWidth={M.hand} strokeLinecap="round" />
      )}
      <circle cx={M.cx} cy={M.cy} r={M.pivot} fill={green} />
      <line x1={M.cx} y1={M.stemY1} x2={M.cx} y2={M.stemY2} stroke={green} strokeWidth={M.stem} strokeLinecap="round" />
      {shouldAnimate ? (
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.6, ease: EASE }}
          style={{ transformOrigin: `${M.cx}px ${M.stemY2}px` }}
        >
          <polygon points={M.leafGreen} fill={green} />
          <polygon points={M.leafAmber} fill={amber} />
        </motion.g>
      ) : (
        <>
          <polygon points={M.leafGreen} fill={green} />
          <polygon points={M.leafAmber} fill={amber} />
        </>
      )}
    </g>
  );

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${geom.vbW} ${geom.vbH}`}
      width={width}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {shouldAnimate ? (
        <motion.g
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: EASE }}
          style={{ transformOrigin: "60px 60px" }}
        >
          {Mark}
        </motion.g>
      ) : (
        Mark
      )}

      {geom.wordmark && (
        <g>
          {shouldAnimate ? (
            <motion.text
              x={wordX}
              y={wordY}
              fontFamily="var(--font-fraunces), Fraunces, Georgia, serif"
              fontStyle="italic"
              fontWeight={600}
              fontSize={geom.fontSize}
              letterSpacing={-1}
              fill={word}
              initial={{ opacity: 0, x: wordX - 8 }}
              animate={{ opacity: 1, x: wordX }}
              transition={{ delay: 0.55, duration: 0.45, ease: EASE }}
            >
              agendalix<tspan fill={amber}>.</tspan>
            </motion.text>
          ) : (
            <text
              x={wordX}
              y={wordY}
              fontFamily="var(--font-fraunces), Fraunces, Georgia, serif"
              fontStyle="italic"
              fontWeight={600}
              fontSize={geom.fontSize}
              letterSpacing={-1}
              fill={word}
            >
              agendalix<tspan fill={amber}>.</tspan>
            </text>
          )}

          {geom.tagline &&
            (shouldAnimate ? (
              <motion.text
                x={wordX + 4}
                y={108}
                fontFamily="var(--font-inter), Inter, sans-serif"
                fontWeight={500}
                fontSize={15}
                letterSpacing="4.5"
                fill={tag}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.95, duration: 0.4 }}
              >
                TUS CITAS, SOLAS
              </motion.text>
            ) : (
              <text
                x={wordX + 4}
                y={108}
                fontFamily="var(--font-inter), Inter, sans-serif"
                fontWeight={500}
                fontSize={15}
                letterSpacing="4.5"
                fill={tag}
              >
                TUS CITAS, SOLAS
              </text>
            ))}
        </g>
      )}
    </svg>
  );
}
