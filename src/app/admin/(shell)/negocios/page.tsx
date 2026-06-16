import { getAllNegocios } from "@/lib/admin-data";
import { NegociosTable } from "@/components/admin/NegociosTable";

export const dynamic = "force-dynamic";

export default async function AdminNegociosPage() {
  const negocios = await getAllNegocios();
  return <NegociosTable initial={negocios} />;
}
