import { Espera } from "@/components/panel/Espera";
import {
  getCurrentNegocio,
  getClientes,
} from "@/lib/panel-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ListaEspera } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

async function getEspera(negocioId: string): Promise<ListaEspera[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("lista_espera")
    .select("*")
    .eq("negocio_id", negocioId)
    .order("created_at", { ascending: false });
  return (data || []) as ListaEspera[];
}

export default async function EsperaPage() {
  const negocio = (await getCurrentNegocio())!;
  const [espera, clientes] = await Promise.all([
    getEspera(negocio.id),
    getClientes(negocio.id),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-medium text-white">Lista de espera</h1>
        <p className="text-[13px] text-ink-secondary mt-1">
          Contacta a clientes cuando haya un hueco disponible.
        </p>
      </header>
      <Espera
        initialEspera={espera}
        clientes={clientes}
        tz={negocio.zona_horaria}
      />
    </div>
  );
}
