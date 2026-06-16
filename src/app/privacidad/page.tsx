import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata = {
  title: "Política de privacidad",
};

export default function PrivacidadPage() {
  return (
    <div className="surface-light bg-paper text-inkl">
      <Navbar />
      <main className="px-6 pt-32 pb-24 max-w-[760px] mx-auto">
        <Link
          href="/"
          className="text-[13px] text-inkl-mute hover:text-inkl transition-colors"
        >
          ← Volver al inicio
        </Link>

        <h1 className="mt-6 font-serif text-[30px] sm:text-[40px] text-inkl font-medium leading-tight">
          Política de privacidad
        </h1>
        <p className="mt-3 text-[13px] text-inkl-mute">
          Última actualización: abril 2026.
        </p>

        <div className="mt-10 space-y-8 text-[15px] text-inkl-soft leading-[1.75]">
          <section>
            <h2 className="font-serif text-[19px] text-inkl font-medium mb-2">
              1. Responsable del tratamiento
            </h2>
            <p>
              Agendalix es el responsable del tratamiento de los datos
              personales que se recogen a través de este sitio y del servicio
              asociado. Puedes contactarnos en{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-brand-deep underline underline-offset-2"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif text-[19px] text-inkl font-medium mb-2">
              2. Datos que recogemos
            </h2>
            <p>
              Recogemos únicamente los datos estrictamente necesarios para
              prestar el servicio: identificadores de contacto (nombre,
              teléfono, email), mensajes cruzados con el agente automatizado y
              metadatos de uso. No vendemos ni cedemos datos a terceros con
              fines comerciales.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-[19px] text-inkl font-medium mb-2">
              3. Finalidad y base legal
            </h2>
            <p>
              Los datos se tratan para la ejecución del contrato (gestión de
              reservas, envío de recordatorios y soporte) y, cuando aplique,
              con tu consentimiento explícito para comunicaciones comerciales.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-[19px] text-inkl font-medium mb-2">
              4. Tus derechos
            </h2>
            <p>
              Puedes ejercer tus derechos de acceso, rectificación, supresión,
              oposición, portabilidad y limitación del tratamiento enviando un
              email a{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-brand-deep underline underline-offset-2"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif text-[19px] text-inkl font-medium mb-2">
              5. Conservación
            </h2>
            <p>
              Conservamos los datos durante el tiempo necesario para cumplir la
              finalidad para la que fueron recogidos y las obligaciones legales
              que nos correspondan.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
