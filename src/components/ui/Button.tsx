"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** "light" = sobre papel (landing/registro), "dark" = panel (defecto). */
  tone?: "dark" | "light";
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-1 focus-visible:outline-purple focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  primary: "bg-purple text-white hover:bg-purple-dark",
  secondary: "bg-bg-card2 text-white hover:bg-[#222] border-[0.5px] border-line-subtle",
  ghost: "text-ink-secondary hover:text-white hover:bg-bg-card2",
  danger: "bg-[#A32D2D] text-white hover:bg-[#8a2626]",
};

const variantsLight: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-deep rounded-full",
  secondary: "bg-white text-inkl hover:bg-paper-warm border border-linel-strong rounded-full",
  ghost: "text-inkl-soft hover:text-inkl hover:bg-paper-deep rounded-full",
  danger: "bg-[#A32D2D] text-white hover:bg-[#8a2626] rounded-full",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px] min-w-[44px]",
  md: "h-11 px-4 text-[14px] min-w-[44px]",
  lg: "h-12 px-5 text-[15px] min-w-[44px]",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", tone = "dark", className = "", loading, disabled, children, ...rest },
  ref,
) {
  const palette = tone === "light" ? variantsLight : variants;
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[base, palette[variant], sizes[size], className].join(" ")}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
});
