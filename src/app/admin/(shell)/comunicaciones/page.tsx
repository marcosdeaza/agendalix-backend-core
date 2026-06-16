import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { EmailLog, Negocio } from "@/lib/supabase/database.types";
import { AdminComunicaciones } from "@/components/admin/AdminComunicaciones";

export const dynamic = "force-dynamic";

export default async function AdminComunicacionesPage() {
  const sb = createSupabaseAdminClient();
  const [logRes, negRes] = await Promise.all([
    sb.from("email_log").select("*").order("sent_at", { ascending: false }).limit(40),
    sb.from("negocios").select("id, nombre, email, plan, activo"),
  ]);
  const logs = (logRes.data || []) as EmailLog[];
  const negocios = (negRes.data || []) as Array<
    Pick<Negocio, "id" | "nombre" | "email" | "plan" | "activo">
  >;
  return <AdminComunicaciones logs={logs} negocios={negocios} />;
}
