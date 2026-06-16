import { Conversaciones } from "@/components/panel/Conversaciones";
import {
  getCurrentNegocio,
  getConversaciones,
  getClientes,
} from "@/lib/panel-data";

export const dynamic = "force-dynamic";

export default async function ConversacionesPage() {
  const negocio = (await getCurrentNegocio())!;
  const [conversaciones, clientes] = await Promise.all([
    getConversaciones(negocio.id),
    getClientes(negocio.id),
  ]);

  return (
    <div className="flex flex-col gap-5 h-full">
      <header>
        <h1 className="text-[22px] font-medium text-white">Conversaciones</h1>
        <p className="text-[13px] text-ink-secondary mt-1">
          Mira en tiempo real lo que tu agente responde e intervén cuando quieras.
        </p>
      </header>
      <Conversaciones
        initialConversaciones={conversaciones}
        clientes={clientes}
        tz={negocio.zona_horaria}
      />
    </div>
  );
}
