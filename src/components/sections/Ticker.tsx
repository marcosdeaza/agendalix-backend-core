import { TICKER_ITEMS } from "@/lib/constants";

export function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      aria-hidden="true"
      className="w-full overflow-hidden bg-paper-deep border-t border-b border-linel py-4"
    >
      <div className="ticker-track whitespace-nowrap">
        {items.map((w, i) => (
          <span
            key={i}
            className="inline-flex items-center font-serif italic text-[15px] text-inkl-mute px-4"
          >
            <span>{w}</span>
            <span
              aria-hidden="true"
              className="ml-8 inline-block w-1.5 h-1.5 rounded-full bg-ambar"
            />
          </span>
        ))}
      </div>
    </div>
  );
}
