import { Agenda } from "@/components/panel/Agenda";
import {
  getCurrentNegocio,
  getAgenteConfig,
  getCitasRange,
  getClientes,
} from "@/lib/panel-data";

export const dynamic = "force-dynamic";

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

export default async function AgendaPage() {
  const negocio = (await getCurrentNegocio())!;
  const config = await getAgenteConfig(negocio.id);

  const rangeStart = startOfWeek(new Date());
  rangeStart.setDate(rangeStart.getDate() - 7);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 42);

  const [citas, clientes] = await Promise.all([
    getCitasRange(negocio.id, rangeStart, rangeEnd),
    getClientes(negocio.id),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-medium text-white">Agenda</h1>
        <p className="text-[13px] text-ink-secondary mt-1">
          Gestiona y edita las citas de {negocio.nombre}.
        </p>
      </header>
      <Agenda
        initialCitas={citas}
        clientes={clientes}
        profesionales={config?.profesionales || []}
        tz={negocio.zona_horaria}
        moneda={negocio.moneda}
        negocioId={negocio.id}
      />
    </div>
  );
}
