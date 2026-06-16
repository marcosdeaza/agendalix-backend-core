import { redirect } from "next/navigation";
import { isAdminConfigured } from "@/lib/admin-session";
import { AdminSetup } from "@/components/admin/AdminSetup";

export const dynamic = "force-dynamic";

export default function AdminSetupPage() {
  if (isAdminConfigured()) redirect("/admin/login");
  return <AdminSetup />;
}
