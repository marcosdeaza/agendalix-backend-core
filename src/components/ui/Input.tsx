"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useId } from "react";

type Tone = "dark" | "light";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> & {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  tone?: Tone;
};

const fieldBase =
  "w-full h-11 px-3.5 text-[14px] bg-bg-card border-[0.5px] rounded-lg text-white placeholder:text-ink-muted transition-colors focus:outline-none focus:border-purple";

const fieldBaseLight =
  "w-full h-11 px-3.5 text-[14px] bg-white border rounded-xl text-inkl placeholder:text-inkl-faint transition-colors focus:outline-none focus:border-brand";

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, prefix, tone = "dark", className = "", id, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id || `i-${reactId}`;
  const light = tone === "light";
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className={light ? "text-[12px] text-inkl-soft font-medium" : "text-[12px] text-ink-secondary"}>
          {label}
        </label>
      ) : null}
      <div className={`relative ${prefix ? "flex items-center" : ""}`}>
        {prefix ? (
          <span className="absolute left-3 text-ink-muted pointer-events-none">{prefix}</span>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
          className={[
            light ? fieldBaseLight : fieldBase,
            prefix ? "pl-9" : "",
            error ? "border-[#A32D2D]" : light ? "border-linel-strong" : "border-line-subtle",
            className,
          ].join(" ")}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${inputId}-err`} className="text-[12px] text-[#E08383]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-[12px] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

type TAProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TAProps>(function Textarea(
  { label, error, hint, className = "", id, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id || `t-${reactId}`;
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-[12px] text-ink-secondary">
          {label}
        </label>
      ) : null}
      <textarea
        id={inputId}
        ref={ref}
        aria-invalid={!!error}
        className={[
          "w-full px-3.5 py-3 text-[14px] bg-bg-card border-[0.5px] rounded-lg text-white placeholder:text-ink-muted focus:outline-none focus:border-purple resize-y min-h-[90px]",
          error ? "border-[#A32D2D]" : "border-line-subtle",
          className,
        ].join(" ")}
        {...rest}
      />
      {error ? (
        <p className="text-[12px] text-[#E08383]">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
});

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  tone?: Tone;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, tone = "dark", className = "", id, ...rest },
  ref,
) {
  const reactId = useId();
  const selectId = id || `s-${reactId}`;
  const light = tone === "light";
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={selectId} className={light ? "text-[12px] text-inkl-soft font-medium" : "text-[12px] text-ink-secondary"}>
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        ref={ref}
        aria-invalid={!!error}
        className={[
          light ? fieldBaseLight : fieldBase,
          "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%232E8F66%22 stroke-width=%221.5%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-no-repeat bg-[right_12px_center] pr-9",
          error ? "border-[#A32D2D]" : light ? "border-linel-strong" : "border-line-subtle",
          className,
        ].join(" ")}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className={light ? "bg-white text-inkl" : "bg-bg-card text-white"}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-[12px] text-[#E08383]">{error}</p> : null}
    </div>
  );
});
