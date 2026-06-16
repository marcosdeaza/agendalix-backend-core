import { Configuracion } from "@/components/panel/Configuracion";
import {
  getCurrentNegocio,
  getAgenteConfig,
} from "@/lib/panel-data";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const negocio = (await getCurrentNegocio())!;
  const config = await getAgenteConfig(negocio.id);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-medium text-white">Configuración</h1>
        <p className="text-[13px] text-ink-secondary mt-1">
          Gestiona tu negocio, servicios, horarios y preferencias regionales.
        </p>
      </header>
      <Configuracion negocio={negocio} config={config} />
    </div>
  );
}
