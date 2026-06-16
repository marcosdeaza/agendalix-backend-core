export const dynamic = "force-dynamic";

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple/10 border border-purple/20 flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2E8F66" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 className="text-[22px] font-semibold text-white mb-3">Solicitud recibida</h1>
        <p className="text-[15px] text-ink-secondary leading-relaxed mb-6">
          Tu cuenta está pendiente de revisión por el equipo de Agendalix.
          Te avisaremos por email en cuanto sea aprobada.
        </p>
        <div className="bg-bg-card border border-line-subtle rounded-xl p-4 text-left mb-6">
          <p className="text-[13px] text-ink-muted mb-2 font-medium">¿Qué pasa ahora?</p>
          <ul className="space-y-2 text-[13px] text-ink-secondary">
            <li className="flex gap-2"><span className="text-purple">1.</span> Nuestro equipo revisa tu solicitud (normalmente en menos de 24h).</li>
            <li className="flex gap-2"><span className="text-purple">2.</span> Recibirás un email con tu enlace de acceso cuando esté aprobada.</li>
            <li className="flex gap-2"><span className="text-purple">3.</span> Configura tu agente de WhatsApp y empieza a recibir citas.</li>
          </ul>
        </div>
        <p className="text-[12px] text-ink-muted">
          ¿Tienes dudas? Escríbenos a{" "}
          <a href="mailto:contacto@agendalix.com" className="text-purple hover:underline">
            contacto@agendalix.com
          </a>
        </p>
      </div>
    </div>
  );
}
