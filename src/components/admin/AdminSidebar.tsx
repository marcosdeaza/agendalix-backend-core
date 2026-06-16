"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "../Logo";
import {
  IconChart,
  IconBuilding,
  IconMail,
  IconLogout,
  IconHelp,
} from "../icons/Icons";

const LINKS = [
  { href: "/admin", label: "Resumen", Icon: IconChart, exact: true },
  { href: "/admin/negocios", label: "Negocios", Icon: IconBuilding },
  { href: "/admin/metricas", label: "Métricas", Icon: IconChart },
  { href: "/admin/comunicaciones", label: "Comunicaciones", Icon: IconMail },
  { href: "/admin/soporte", label: "Soporte", Icon: IconHelp },
];

export function AdminSidebar() {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-[240px] bg-bg-deep border-r-[0.5px] border-line-soft flex-col z-30">
      <div className="px-5 h-[72px] flex items-center border-b-[0.5px] border-line-soft">
        <Link href="/admin" aria-label="Inicio admin" className="flex items-center gap-2">
          <Logo variant="compact" size={28} />
          <span className="text-[11px] tracking-[0.14em] uppercase text-ink-muted">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {LINKS.map((l) => {
          const active = l.exact ? path === l.href : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={[
                "flex items-center gap-3 px-3 h-10 rounded-lg text-[13px] transition-colors",
                active
                  ? "bg-bg-card2 text-white"
                  : "text-ink-secondary hover:bg-bg-card2 hover:text-white",
              ].join(" ")}
            >
              <l.Icon size={18} />
              <span className="flex-1 truncate">{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t-[0.5px] border-line-soft">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2 px-2 h-9 rounded-md text-[12px] text-ink-secondary hover:text-white hover:bg-bg-card2 transition-colors"
        >
          <IconLogout size={16} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
