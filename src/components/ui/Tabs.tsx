"use client";

type Props<T extends string> = {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
};

export function Tabs<T extends string>({ tabs, value, onChange, className = "" }: Props<T>) {
  return (
    <div role="tablist" className={`flex w-full overflow-x-auto scrollbar-hide p-1 bg-bg-card2 rounded-lg border-[0.5px] border-line-subtle ${className}`}>
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={[
              "px-3 h-9 rounded-md text-[13px] transition-colors whitespace-nowrap shrink-0",
              active ? "bg-purple text-white" : "text-ink-secondary hover:text-white",
            ].join(" ")}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
