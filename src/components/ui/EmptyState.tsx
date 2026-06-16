import { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: ReactNode;
};

function DefaultIllustration() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">
      <rect x="8" y="18" width="104" height="68" rx="8" stroke="#1e1e1e" strokeWidth="1" />
      <rect x="18" y="30" width="84" height="8" rx="2" fill="#1a1a1a" />
      <rect x="18" y="44" width="56" height="6" rx="2" fill="#161616" />
      <rect x="18" y="56" width="70" height="6" rx="2" fill="#161616" />
      <circle cx="96" cy="30" r="4" fill="#2E8F66" opacity="0.6" />
    </svg>
  );
}

export function EmptyState({ title, description, action, illustration }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="mb-4">{illustration ?? <DefaultIllustration />}</div>
      <h3 className="text-[15px] font-medium text-white">{title}</h3>
      {description ? (
        <p className="text-[13px] text-ink-secondary mt-2 max-w-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
