import Link from "next/link";
import { Logo } from "./Logo";
import { CONTACT_EMAIL, WHATSAPP_LINK } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-paper-deep border-t border-linel">
      <div className="mx-auto max-w-content px-6 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Col 1 — Logo + tagline + email */}
          <div className="flex flex-col gap-4">
            <Logo variant="mark" size={40} tone="light" />
            <p className="font-serif italic text-[15px] text-inkl-soft leading-relaxed max-w-[260px]">
              Tus citas se reservan solas. Tú, a lo tuyo.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[13px] text-inkl-soft hover:text-inkl transition-colors duration-150"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          {/* Col 2 — Links */}
          <div className="flex flex-col gap-3">
            <p className="text-label uppercase text-inkl-mute tracking-[0.14em]">Navegación</p>
            <Link href="/" className="text-[14px] text-inkl-soft hover:text-brand-deep transition-colors duration-150">
              Inicio
            </Link>
            <Link href="#features" className="text-[14px] text-inkl-soft hover:text-brand-deep transition-colors duration-150">
              Producto
            </Link>
            <Link href="#pricing" className="text-[14px] text-inkl-soft hover:text-brand-deep transition-colors duration-150">
              Precios
            </Link>
            <Link href="/panel/login" className="text-[14px] text-inkl-soft hover:text-brand-deep transition-colors duration-150">
              Acceder al panel
            </Link>
            <Link href="/privacidad" className="text-[14px] text-inkl-soft hover:text-brand-deep transition-colors duration-150">
              Política de privacidad
            </Link>
          </div>

          {/* Col 3 — Contact */}
          <div className="flex flex-col gap-3">
            <p className="text-label uppercase text-inkl-mute tracking-[0.14em]">Contacto</p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[14px] text-inkl-soft hover:text-brand-deep transition-colors duration-150 w-fit"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M20.5 3.5A11 11 0 0 0 3.5 17.9L2 22l4.2-1.4A11 11 0 1 0 20.5 3.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 10.5c0-1 .6-2.5 2-2.5.3 0 .6.4.9 1l.5 1.2c.1.3 0 .5-.2.7l-.6.5c.6 1.2 1.4 2 2.6 2.6l.5-.6c.2-.2.4-.3.7-.2l1.2.5c.6.3 1 .6 1 .9 0 1.4-1.5 2-2.5 2-1.5 0-6.1-2.1-6.1-6.1Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Contactar por WhatsApp
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[14px] text-inkl-soft hover:text-brand-deep transition-colors duration-150 w-fit"
            >
              Escribir un email
            </a>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-linel">
          <p className="text-center text-[11px] text-inkl-mute tracking-wide">
            © 2026 Agendalix. Hecho en España para negocios locales.
          </p>
        </div>
      </div>
    </footer>
  );
}
