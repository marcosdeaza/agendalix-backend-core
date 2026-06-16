import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a0a",
          card: "#111111",
          card2: "#1a1a1a",
          deep: "#080808",
          nav: "#0d0d0d",
        },
        // Accent (panel oscuro): verde Agendalix con suficiente luminosidad sobre negro
        purple: {
          DEFAULT: "#2E8F66",
          light: "#7FC9A6",
          dark: "#1C5E43",
        },
        ink: {
          muted: "#555555",
          secondary: "#888888",
          faint: "#333333",
        },
        line: {
          subtle: "#1e1e1e",
          mid: "#2a2a2a",
          soft: "#1a1a1a",
        },
        // ── Identidad landing v2: papel cálido + tinta + verde profundo ──
        paper: {
          DEFAULT: "#FAF7F0",
          deep: "#F1EBDE",
          warm: "#F6F1E6",
        },
        inkl: {
          DEFAULT: "#201C12",
          soft: "#5B5546",
          mute: "#8B8470",
          faint: "#B5AE9C",
        },
        brand: {
          DEFAULT: "#1E6B4F",
          deep: "#14503A",
          soft: "#E4F0E8",
          ink: "#0E3D2C",
        },
        ambar: {
          DEFAULT: "#D9912B",
          soft: "#F7E8CF",
        },
        linel: {
          DEFAULT: "#E8E1D1",
          strong: "#D8CFBA",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Fraunces", "Georgia", "serif"],
      },
      fontSize: {
        hero: ["56px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        section: ["36px", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        card: ["18px", { lineHeight: "1.3" }],
        body: ["15px", { lineHeight: "1.7" }],
        label: ["11px", { lineHeight: "1.4", letterSpacing: "0.14em" }],
      },
      maxWidth: {
        content: "1100px",
      },
      boxShadow: {
        featured: "0 -1px 20px rgba(46, 143, 102, 0.22)",
        glow: "0 0 40px rgba(46, 143, 102, 0.15)",
        // Sombras cálidas para tarjetas sobre papel
        card: "0 1px 2px rgba(32, 28, 18, 0.05), 0 8px 24px -12px rgba(32, 28, 18, 0.12)",
        lift: "0 2px 4px rgba(32, 28, 18, 0.06), 0 18px 40px -16px rgba(32, 28, 18, 0.18)",
        phone: "0 30px 60px -18px rgba(20, 80, 58, 0.28), 0 0 0 1px rgba(32,28,18,0.06)",
      },
      keyframes: {
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "bounce-slow": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.35" },
          "50%": { transform: "translateY(6px)", opacity: "0.8" },
        },
        "typing-dot": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
        "pulse-skel": {
          "0%, 100%": { backgroundColor: "#141414" },
          "50%": { backgroundColor: "#1f1f1f" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" },
        },
      },
      animation: {
        ticker: "ticker-scroll 25s linear infinite",
        bounce: "bounce-slow 2.2s ease-in-out infinite",
        typing: "typing-dot 1.4s ease-in-out infinite",
        skeleton: "pulse-skel 1.4s ease-in-out infinite",
        shake: "shake 0.35s ease-in-out",
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (u: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },
        ".scrollbar-hide::-webkit-scrollbar": {
          display: "none",
        },
      });
    },
  ],
};

export default config;
