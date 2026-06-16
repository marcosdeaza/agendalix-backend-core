"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "../Logo";
import {
  IconCalendar,
  IconUsers,
  IconChat,
  IconChart,
  IconClock,
  IconSettings,
  IconLogout,
  IconHelp,
} from "../icons/Icons";
import { Badge } from "../ui/Badge";
import { NotifBell } from "./NotifBell";
import type { Plan } from "@/lib/supabase/database.types";

type Props = {
  negocioNombre: string;
  plan: Plan;
  unreadCount: number;
  trialDaysLeft?: number | null;
};

const LINKS = [
  { href: "/panel/agenda", label: "Agenda", Icon: IconCalendar },
  { href: "/panel/clientes", label: "Clientes", Icon: IconUsers },
  { href: "/panel/conversaciones", label: "Conversaciones", Icon: IconChat, badge: true },
  { href: "/panel/informes", label: "Informes", Icon: IconChart },
  { href: "/panel/espera", label: "Lista de espera", Icon: IconClock },
  { href: "/panel/soporte", label: "Soporte", Icon: IconHelp },
  { href: "/panel/configuracion", label: "Configuración", Icon: IconSettings },
];

function planLabel(p: Plan): string {
  return { trial: "Prueba", basico: "Básico", pro: "Pro", clinica: "Clínica" }[p];
}

export function Sidebar({ negocioNombre, plan, unreadCount, trialDaysLeft = null }: Props) {
  const path = usePathname();
  return (
    <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-[240px] bg-bg-deep border-r-[0.5px] border-line-soft flex-col z-30">
      <div className="px-5 h-[72px] flex items-center border-b-[0.5px] border-line-soft">
        <Link href="/panel" aria-label="Inicio panel" className="flex items-center">
          <Logo variant="compact" size={28} />
        </Link>
      </div>

      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        <Link
          href="/panel"
          className={[
            "flex items-center gap-3 px-3 h-10 rounded-lg text-[13px] transition-colors",
            path === "/panel"
              ? "bg-bg-card2 text-white"
              : "text-ink-secondary hover:bg-bg-card2 hover:text-white",
          ].join(" ")}
        >
          <IconChart size={18} /> Inicio
        </Link>
        {LINKS.map((l) => {
          const active = path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={[
                "flex items-center gap-3 px-3 h-10 rounded-lg text-[13px] transition-colors relative",
                active ? "bg-bg-card2 text-white" : "text-ink-secondary hover:bg-bg-card2 hover:text-white",
              ].join(" ")}
            >
              <l.Icon size={18} />
              <span className="flex-1 truncate">{l.label}</span>
              {l.badge && unreadCount > 0 ? (
                <span className="ml-auto min-w-[18px] h-[18px] px-1.5 rounded-full bg-purple text-white text-[10px] font-medium flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t-[0.5px] border-line-soft">
        {plan === "trial" && trialDaysLeft !== null && trialDaysLeft > 0 ? (
          <Link
            href="/panel/plan"
            className="block mb-3 rounded-xl border border-[#2E8F6644] bg-[#2E8F6614] px-3 py-2.5 hover:border-[#2E8F66] transition-colors"
          >
            <p className="text-[12px] text-[#7FC9A6] font-medium">
              {trialDaysLeft} {trialDaysLeft === 1 ? "día" : "días"} de prueba
            </p>
            <p className="text-[11px] text-ink-secondary mt-0.5">Elegir plan →</p>
          </Link>
        ) : null}
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] text-white truncate" title={negocioNombre}>{negocioNombre}</p>
            <NotifBell />
          </div>
          <Link href="/panel/plan" className="mt-1.5 inline-block hover:opacity-80 transition-opacity" title="Plan y facturación">
            <Badge tone="purple">{planLabel(plan)}</Badge>
          </Link>
        </div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-2 h-9 rounded-md text-[12px] text-ink-secondary hover:text-white hover:bg-bg-card2 transition-colors"
          >
            <IconLogout size={16} /> Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
