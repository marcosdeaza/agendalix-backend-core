import { Informes } from "@/components/panel/Informes";
import { InformesGate } from "@/components/panel/InformesGate";
import {
  getCurrentNegocio,
  getCitasRange,
  getClientes,
} from "@/lib/panel-data";
import { hasFeature } from "@/lib/plan-features";

export const dynamic = "force-dynamic";

export default async function InformesPage() {
  const negocio = (await getCurrentNegocio())!;
  const canAccess = hasFeature(negocio.plan, "informes_avanzados");

  const end = new Date();
  const start = new Date(end.getTime() - 180 * 24 * 60 * 60 * 1000);
  const [citas, clientes] = await Promise.all([
    getCitasRange(negocio.id, start, end),
    getClientes(negocio.id),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-medium text-white">Informes</h1>
        <p className="text-[13px] text-ink-secondary mt-1">
          Revisa tu rendimiento y exporta a Excel cuando lo necesites.
        </p>
      </header>
      {canAccess ? (
        <Informes
          citas={citas}
          clientes={clientes}
          tz={negocio.zona_horaria}
          moneda={negocio.moneda}
        />
      ) : (
        <InformesGate plan={negocio.plan} />
      )}
    </div>
  );
}
