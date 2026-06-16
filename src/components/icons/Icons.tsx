import type { SVGProps } from "react";

type IP = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 22, children, ...rest }: IP & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2E8F66"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconCalendar = (p: IP) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Base>
);

export const IconUsers = (p: IP) => (
  <Base {...p}>
    <path d="M16 14a4 4 0 10-8 0" />
    <circle cx="12" cy="8" r="3" />
    <path d="M4 20c0-2.5 2.7-4 6-4s6 1.5 6 4" />
    <path d="M17 11a3 3 0 000-6" />
    <path d="M21 20c0-2-1.8-3.3-4-3.8" />
  </Base>
);

export const IconChat = (p: IP) => (
  <Base {...p}>
    <path d="M21 12a8 8 0 01-11.3 7.3L4 21l1.7-5A8 8 0 1121 12z" />
  </Base>
);

export const IconChart = (p: IP) => (
  <Base {...p}>
    <path d="M4 20V8M10 20V4M16 20v-7M22 20H2" />
  </Base>
);

export const IconClock = (p: IP) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Base>
);

export const IconSettings = (p: IP) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 14.4a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V20a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H4a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3h.1a1.6 1.6 0 001-1.5V4a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8v.1a1.6 1.6 0 001.5 1H20a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" />
  </Base>
);

export const IconLogout = (p: IP) => (
  <Base {...p}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </Base>
);

export const IconPlus = (p: IP) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconTrash = (p: IP) => (
  <Base {...p}>
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    <path d="M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" />
    <path d="M10 11v6M14 11v6" />
  </Base>
);

export const IconCheck = (p: IP) => (
  <Base {...p}>
    <path d="M5 12l5 5L20 7" />
  </Base>
);

export const IconX = (p: IP) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const IconChevronLeft = (p: IP) => (
  <Base {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Base>
);

export const IconChevronRight = (p: IP) => (
  <Base {...p}>
    <path d="M9 6l6 6-6 6" />
  </Base>
);

export const IconSearch = (p: IP) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Base>
);

export const IconDownload = (p: IP) => (
  <Base {...p}>
    <path d="M12 3v12M6 11l6 6 6-6" />
    <path d="M5 21h14" />
  </Base>
);

export const IconPhone = (p: IP) => (
  <Base {...p}>
    <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.8.3 1.6.6 2.4a2 2 0 01-.5 2.1L8 9.5a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.5c.8.3 1.6.5 2.4.6a2 2 0 011.7 2z" />
  </Base>
);

export const IconMail = (p: IP) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </Base>
);

export const IconEuro = (p: IP) => (
  <Base {...p}>
    <path d="M18 7a7 7 0 100 10" />
    <path d="M4 10h10M4 14h10" />
  </Base>
);

export const IconList = (p: IP) => (
  <Base {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </Base>
);

export const IconMenu = (p: IP) => (
  <Base {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Base>
);

export const IconQr = (p: IP) => (
  <Base {...p}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <path d="M14 14h3v3M20 14v3M14 20h3M20 20h1" />
  </Base>
);

export const IconEye = (p: IP) => (
  <Base {...p}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

export const IconSparkle = (p: IP) => (
  <Base {...p}>
    <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
  </Base>
);

export const IconAlert = (p: IP) => (
  <Base {...p}>
    <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </Base>
);

export const IconEdit = (p: IP) => (
  <Base {...p}>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2 2 0 012.8 2.8L12 14.5 8 15l.5-4 10-8.5z" />
  </Base>
);

export const IconBuilding = (p: IP) => (
  <Base {...p}>
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01" />
  </Base>
);

export const IconBell = (p: IP) => (
  <Base {...p}>
    <path d="M18 16v-5a6 6 0 10-12 0v5l-2 2h16z" />
    <path d="M10 21a2 2 0 004 0" />
  </Base>
);

export const IconArrowRight = (p: IP) => (
  <Base {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);

export const IconHelp = (p: IP) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.3 9.2a2.8 2.8 0 0 1 5.4 1c0 1.8-2.7 2.2-2.7 3.6" />
    <circle cx="12" cy="17.2" r="0.4" fill="currentColor" />
  </Base>
);

export const IconSend = (p: IP) => (
  <Base {...p}>
    <path d="M4 12l16-8-6 18-3-7-7-3Z" />
  </Base>
);
