// Hilo de soporte plataforma↔negocio.
// Vive en la tabla `conversaciones` con este identificador reservado en
// cliente_telefono (no es un teléfono válido, así que nunca colisiona con
// conversaciones reales de WhatsApp y no requiere cambios de esquema).
export const SOPORTE_TELEFONO = "__soporte__";
