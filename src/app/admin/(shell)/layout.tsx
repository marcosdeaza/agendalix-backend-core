import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { cookies } from "next/headers";
import { verifyAdminJwt, ADMIN_COOKIE, isAdminConfigured } from "@/lib/admin-session";
import { redirect } from "next/navigation";
import { ToastProvider } from "@/components/ui/Toast";

export const dynamic = "force-dynamic";

export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  if (!isAdminConfigured()) redirect("/admin/setup");

  const token = cookies().get(ADMIN_COOKIE)?.value;
  const ok = token ? await verifyAdminJwt(token) : false;
  if (!ok) redirect("/admin/login");

  return (
    <ToastProvider>
      <div className="min-h-dvh bg-[#070707] text-white">
        <AutoRefresh seconds={30} />
        <AdminSidebar />
        <main className="md:ml-[240px] min-h-dvh">{children}</main>
      </div>
    </ToastProvider>
  );
}
