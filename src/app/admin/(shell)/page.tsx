import { getAdminStats } from "@/lib/admin-data";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const stats = await getAdminStats();
  return <AdminDashboard stats={stats} />;
}
