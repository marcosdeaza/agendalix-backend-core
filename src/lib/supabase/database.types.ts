export type Plan = "trial" | "basico" | "pro" | "clinica";
export type CitaEstado = "confirmada" | "pendiente" | "cancelada" | "completada";
export type EsperaEstado = "esperando" | "notificado" | "convertido" | "cancelado";

export type Servicio = {
  id: string;
  nombre: string;
  duracion: number;
  precio: number;
};

export type Profesional = {
  id: string;
  nombre: string;
  servicios: string[];
  horarios?: Horarios;
};

export type HorarioDia = {
  abierto: boolean;
  apertura: string;
  cierre: string;
};

export type Horarios = {
  lun?: HorarioDia;
  mar?: HorarioDia;
  mie?: HorarioDia;
  jue?: HorarioDia;
  vie?: HorarioDia;
  sab?: HorarioDia;
  dom?: HorarioDia;
};

export type RecordatorioConfig = {
  id: string;
  horasAntes: number;
  mensaje: string;
  activo: boolean;
};

export type HorariosConMeta = Horarios & {
  _recordatorios?: RecordatorioConfig[];
  _sent_log?: Record<string, string>;
};

export type Mensaje = {
  id: string;
  role: "cliente" | "agente" | "humano";
  text: string;
  timestamp: string;
};

export type Negocio = {
  id: string;
  nombre: string;
  sector: string;
  email: string;
  telefono: string | null;
  whatsapp_number: string | null;
  zona_horaria: string;
  moneda: string;
  idioma: string;
  plan: Plan;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  activo: boolean;
  onboarding_completo: boolean;
  last_login_at: string | null;
  created_at: string;
};

export type AgenteConfig = {
  id: string;
  negocio_id: string;
  mensaje_bienvenida: string;
  servicios: Servicio[];
  horarios: HorariosConMeta;
  profesionales: Profesional[];
  dias_cierre: string[];
  duracion_cita_default: number;
  updated_at: string;
};

export type Cliente = {
  id: string;
  negocio_id: string;
  nombre: string | null;
  telefono: string;
  ultima_visita: string | null;
  total_visitas: number;
  notas: string | null;
  created_at: string;
};

export type Cita = {
  id: string;
  negocio_id: string;
  cliente_id: string | null;
  profesional: string | null;
  servicio: string | null;
  inicio: string;
  fin: string;
  estado: CitaEstado;
  recordatorio_enviado: boolean;
  notas: string | null;
  precio: number | null;
  created_at: string;
};

export type ListaEspera = {
  id: string;
  negocio_id: string;
  cliente_id: string | null;
  servicio: string | null;
  profesional: string | null;
  fecha_preferida: string | null;
  prioridad: number;
  estado: EsperaEstado;
  created_at: string;
};

export type Conversacion = {
  id: string;
  negocio_id: string;
  cliente_telefono: string;
  mensajes: Mensaje[];
  intervenida: boolean;
  leida_hasta: string;
  updated_at: string;
};

export type Uso = {
  id: string;
  negocio_id: string;
  fecha: string;
  mensajes_procesados: number;
  tokens_deepseek: number;
  citas_gestionadas: number;
  recuperacion_enviados: number;
};

export type MagicToken = {
  id: string;
  token_hash: string;
  email: string;
  negocio_id: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

export type NotificacionTipo = "cita_nueva" | "cancelacion" | "sistema";

export type Notificacion = {
  id: string;
  negocio_id: string;
  titulo: string;
  mensaje: string;
  tipo: NotificacionTipo;
  leido: boolean;
  created_at: string;
};

export type EmailLog = {
  id: string;
  scope: string;
  subject: string;
  body: string;
  recipients_count: number;
  sent_at: string;
};

export type Database = {
  public: {
    Tables: {
      negocios: {
        Row: Negocio;
        Insert: Partial<Omit<Negocio, "id" | "created_at">> & {
          id?: string;
          nombre: string;
          sector: string;
          email: string;
        };
        Update: Partial<Negocio>;
      };
      agente_config: {
        Row: AgenteConfig;
        Insert: Partial<Omit<AgenteConfig, "id" | "updated_at">> & {
          negocio_id: string;
        };
        Update: Partial<AgenteConfig>;
      };
      clientes: {
        Row: Cliente;
        Insert: Partial<Omit<Cliente, "id" | "created_at">> & {
          negocio_id: string;
          telefono: string;
        };
        Update: Partial<Cliente>;
      };
      citas: {
        Row: Cita;
        Insert: Partial<Omit<Cita, "id" | "created_at">> & {
          negocio_id: string;
          inicio: string;
          fin: string;
        };
        Update: Partial<Cita>;
      };
      lista_espera: {
        Row: ListaEspera;
        Insert: Partial<Omit<ListaEspera, "id" | "created_at">> & {
          negocio_id: string;
        };
        Update: Partial<ListaEspera>;
      };
      conversaciones: {
        Row: Conversacion;
        Insert: Partial<Omit<Conversacion, "id" | "updated_at">> & {
          negocio_id: string;
          cliente_telefono: string;
        };
        Update: Partial<Conversacion>;
      };
      uso: {
        Row: Uso;
        Insert: Partial<Omit<Uso, "id">> & { negocio_id: string };
        Update: Partial<Uso>;
      };
      magic_tokens: {
        Row: MagicToken;
        Insert: Partial<Omit<MagicToken, "id" | "created_at">> & {
          token_hash: string;
          email: string;
          negocio_id: string;
          expires_at: string;
        };
        Update: Partial<MagicToken>;
      };
      email_log: {
        Row: EmailLog;
        Insert: Partial<Omit<EmailLog, "id" | "sent_at">> & {
          scope: string;
          subject: string;
          body: string;
        };
        Update: Partial<EmailLog>;
      };
    };
  };
};
