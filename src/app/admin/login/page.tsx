import { redirect } from "next/navigation";
import { isAdminConfigured } from "@/lib/admin-session";
import { AdminLogin } from "@/components/admin/AdminLogin";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  if (!isAdminConfigured()) redirect("/admin/setup");
  return <AdminLogin />;
}
