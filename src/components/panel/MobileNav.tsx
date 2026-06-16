"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCalendar, IconUsers, IconChat, IconHelp, IconSettings } from "../icons/Icons";

const LINKS = [
  { href: "/panel/agenda", label: "Agenda", Icon: IconCalendar },
  { href: "/panel/clientes", label: "Clientes", Icon: IconUsers },
  { href: "/panel/conversaciones", label: "Chat", Icon: IconChat },
  { href: "/panel/soporte", label: "Soporte", Icon: IconHelp },
  { href: "/panel/configuracion", label: "Config", Icon: IconSettings },
];

export function MobileNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Navegación principal"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg-deep border-t-[0.5px] border-line-soft h-[64px] flex items-stretch pb-[env(safe-area-inset-bottom)]"
    >
      {LINKS.map((l) => {
        const active = path === l.href || path.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className="flex-1 min-w-[44px] flex flex-col items-center justify-center gap-1 text-[10px] transition-colors"
          >
            <l.Icon size={20} style={{ stroke: active ? "#2E8F66" : "#555" }} />
            <span style={{ color: active ? "#2E8F66" : "#555" }}>{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
