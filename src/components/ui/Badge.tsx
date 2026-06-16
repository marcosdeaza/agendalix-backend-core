import { HTMLAttributes } from "react";

type Tone = "purple" | "green" | "yellow" | "red" | "blue" | "neutral";
type Props = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

const tones: Record<Tone, string> = {
  purple: "bg-purple/15 text-purple-light border-purple/30",
  green: "bg-[#1c3a22] text-[#8ce9a3] border-[#2a5d36]",
  yellow: "bg-[#3a2e12] text-[#F2B560] border-[#6B4919]",
  red: "bg-[#3a1717] text-[#E08383] border-[#5d2a2a]",
  blue: "bg-[#162438] text-[#7BB3F7] border-[#274468]",
  neutral: "bg-bg-card2 text-ink-secondary border-line-subtle",
};

export function Badge({ className = "", tone = "neutral", children, ...rest }: Props) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2 h-[22px] rounded-md text-[11px] font-medium border-[0.5px] tracking-wide",
        tones[tone],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </span>
  );
}
