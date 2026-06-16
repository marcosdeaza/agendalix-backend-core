import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/panel/Sidebar";
import { MobileNav } from "@/components/panel/MobileNav";
import { ToastProvider } from "@/components/ui/Toast";
import { getCurrentNegocio, getUnreadCount } from "@/lib/panel-data";
import { RealtimeCitas } from "@/components/panel/RealtimeCitas";
import { trialDaysLeft, isTrialExpired } from "@/lib/trial";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const pathname = h.get("x-pathname");
  // Login: si ya hay sesión válida, directo al panel (nada de re-loguearse)
  if (pathname === "/panel/login") {
    const yaLogueado = await getCurrentNegocio();
    if (yaLogueado) redirect("/panel");
    return <>{children}</>;
  }
  // Páginas especiales sin layout/auth
  if (pathname === "/panel/auth-callback" || pathname === "/panel/pending") {
    return <>{children}</>;
  }
  const negocio = await getCurrentNegocio();
  if (!negocio) redirect("/panel/login");

  // Prueba caducada sin suscripción → paywall (los datos siguen ahí,
  // pero el panel solo permite elegir plan o contactar con soporte)
  const expired = isTrialExpired(negocio);
  if (expired && pathname !== "/panel/plan" && pathname !== "/panel/soporte") {
    redirect("/panel/plan");
  }

  const unread = await getUnreadCount(negocio.id);
  const daysLeft = trialDaysLeft(negocio);

  return (
    <ToastProvider>
      <RealtimeCitas negocioId={negocio.id} />
      <div className="min-h-screen bg-bg">
        <Sidebar
          negocioNombre={negocio.nombre}
          plan={negocio.plan}
          unreadCount={unread}
          trialDaysLeft={daysLeft}
        />
        <MobileNav />
        <div className="md:pl-[240px]">
          <main className="p-5 sm:p-8 pb-[80px] md:pb-10 max-w-[1280px] mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
