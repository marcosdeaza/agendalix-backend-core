import { getAdminStats, getAdminUsoSerie } from "@/lib/admin-data";
import { AdminMetricas } from "@/components/admin/AdminMetricas";

export const dynamic = "force-dynamic";

export default async function AdminMetricasPage() {
  const [stats, serie] = await Promise.all([getAdminStats(), getAdminUsoSerie(30)]);
  return <AdminMetricas stats={stats} serie={serie} />;
}
