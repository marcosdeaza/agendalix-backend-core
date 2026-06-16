import { Clientes } from "@/components/panel/Clientes";
import {
  getCurrentNegocio,
  getClientes,
  getCitasRange,
} from "@/lib/panel-data";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const negocio = (await getCurrentNegocio())!;
  const [clientes, citas] = await Promise.all([
    getClientes(negocio.id),
    getCitasRange(
      negocio.id,
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    ),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-medium text-white">Clientes</h1>
        <p className="text-[13px] text-ink-secondary mt-1">
          {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"} registrados en {negocio.nombre}.
        </p>
      </header>
      <Clientes
        initialClientes={clientes}
        citas={citas}
        tz={negocio.zona_horaria}
        moneda={negocio.moneda}
      />
    </div>
  );
}
