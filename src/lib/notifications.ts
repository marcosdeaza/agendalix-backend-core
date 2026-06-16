import { createSupabaseAdminClient } from "./supabase/admin";
import type { NotificacionTipo } from "./supabase/database.types";

export async function insertNotificacion(opts: {
  negocioId: string;
  titulo: string;
  mensaje: string;
  tipo: NotificacionTipo;
}) {
  try {
    const admin = createSupabaseAdminClient();
    await admin.from("notificaciones").insert({
      negocio_id: opts.negocioId,
      titulo: opts.titulo,
      mensaje: opts.mensaje,
      tipo: opts.tipo,
      leido: false,
    });
  } catch (err) {
    console.error("insertNotificacion failed", err);
  }
}
