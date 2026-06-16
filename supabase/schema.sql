-- Agendalix — complete Supabase schema.
-- Run in the Supabase SQL editor on a fresh project.

create extension if not exists "pgcrypto";

-- ─── NEGOCIOS ─────────────────────────────────────────
create table if not exists negocios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  sector text not null,
  email text unique not null,
  telefono text,
  whatsapp_number text,
  zona_horaria text default 'Europe/Madrid' not null,
  moneda text default 'EUR' not null,
  idioma text default 'es' not null,
  plan text default 'trial' check (plan in ('trial','basico','pro','clinica')),
  trial_ends_at timestamptz default now() + interval '60 days',
  stripe_customer_id text,
  stripe_subscription_id text,
  activo boolean default true,
  onboarding_completo boolean default false,
  last_login_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists negocios_plan_idx on negocios(plan);
create index if not exists negocios_activo_idx on negocios(activo);
create index if not exists negocios_whatsapp_idx on negocios(whatsapp_number);

alter table negocios add column if not exists zona_horaria text default 'Europe/Madrid' not null;
alter table negocios add column if not exists moneda text default 'EUR' not null;
alter table negocios add column if not exists idioma text default 'es' not null;

-- ─── CONFIGURACION DEL AGENTE ─────────────────────────
create table if not exists agente_config (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references negocios(id) on delete cascade unique,
  mensaje_bienvenida text default 'Hola! Soy el asistente de {nombre}. ¿En qué te puedo ayudar?',
  servicios jsonb default '[]',
  horarios jsonb default '{}',
  profesionales jsonb default '[]',
  dias_cierre jsonb default '[]',
  duracion_cita_default integer default 60,
  updated_at timestamptz default now()
);

-- ─── CLIENTES ─────────────────────────────────────────
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references negocios(id) on delete cascade,
  nombre text,
  telefono text not null,
  ultima_visita timestamptz,
  total_visitas integer default 0,
  notas text,
  created_at timestamptz default now(),
  unique(negocio_id, telefono)
);
create index if not exists clientes_negocio_idx on clientes(negocio_id);
create index if not exists clientes_telefono_idx on clientes(telefono);

-- ─── CITAS ────────────────────────────────────────────
create table if not exists citas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references negocios(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete set null,
  profesional text,
  servicio text,
  inicio timestamptz not null,
  fin timestamptz not null,
  estado text default 'confirmada'
    check (estado in ('confirmada','pendiente','cancelada','completada')),
  recordatorio_enviado boolean default false,
  notas text,
  precio numeric(10,2),
  created_at timestamptz default now()
);
create index if not exists citas_negocio_inicio_idx on citas(negocio_id, inicio);
create index if not exists citas_cliente_idx on citas(cliente_id);
create index if not exists citas_estado_idx on citas(estado);

-- ─── LISTA DE ESPERA ──────────────────────────────────
create table if not exists lista_espera (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references negocios(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete set null,
  servicio text,
  profesional text,
  fecha_preferida date,
  prioridad integer default 0,
  estado text default 'esperando'
    check (estado in ('esperando','notificado','convertido','cancelado')),
  created_at timestamptz default now()
);
create index if not exists lista_espera_negocio_idx on lista_espera(negocio_id, estado);

-- ─── CONVERSACIONES WHATSAPP ──────────────────────────
create table if not exists conversaciones (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references negocios(id) on delete cascade,
  cliente_telefono text not null,
  mensajes jsonb default '[]',
  intervenida boolean default false,
  leida_hasta timestamptz default now(),
  updated_at timestamptz default now(),
  unique(negocio_id, cliente_telefono)
);
create index if not exists conversaciones_negocio_idx on conversaciones(negocio_id, updated_at desc);

-- ─── USO / METRICAS ───────────────────────────────────
create table if not exists uso (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid references negocios(id) on delete cascade,
  fecha date default current_date,
  mensajes_procesados integer default 0,
  tokens_deepseek integer default 0,
  citas_gestionadas integer default 0,
  recuperacion_enviados integer default 0,
  unique(negocio_id, fecha)
);
create index if not exists uso_negocio_fecha_idx on uso(negocio_id, fecha desc);

-- ─── MAGIC LINK TOKENS (one-time login tokens) ────────
create table if not exists magic_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text unique not null,
  email text not null,
  negocio_id uuid references negocios(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists magic_tokens_hash_idx on magic_tokens(token_hash);
create index if not exists magic_tokens_expires_idx on magic_tokens(expires_at);

-- ─── EMAIL LOG ADMIN ──────────────────────────────────
create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  subject text not null,
  body text not null,
  recipients_count integer default 0,
  sent_at timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────
alter table negocios          enable row level security;
alter table agente_config     enable row level security;
alter table clientes          enable row level security;
alter table citas             enable row level security;
alter table lista_espera      enable row level security;
alter table conversaciones    enable row level security;
alter table uso               enable row level security;

-- Policies: negocio only sees its own data. Negocio.id === auth.uid().
drop policy if exists "negocio_own"   on negocios;
drop policy if exists "config_own"    on agente_config;
drop policy if exists "clientes_own"  on clientes;
drop policy if exists "citas_own"     on citas;
drop policy if exists "espera_own"    on lista_espera;
drop policy if exists "conv_own"      on conversaciones;
drop policy if exists "uso_own"       on uso;

create policy "negocio_own" on negocios
  for all using (auth.uid()::text = id::text);

create policy "config_own" on agente_config
  for all using (
    negocio_id in (select id from negocios where auth.uid()::text = id::text)
  );

create policy "clientes_own" on clientes
  for all using (
    negocio_id in (select id from negocios where auth.uid()::text = id::text)
  );

create policy "citas_own" on citas
  for all using (
    negocio_id in (select id from negocios where auth.uid()::text = id::text)
  );

create policy "espera_own" on lista_espera
  for all using (
    negocio_id in (select id from negocios where auth.uid()::text = id::text)
  );

create policy "conv_own" on conversaciones
  for all using (
    negocio_id in (select id from negocios where auth.uid()::text = id::text)
  );

create policy "uso_own" on uso
  for all using (
    negocio_id in (select id from negocios where auth.uid()::text = id::text)
  );

-- Realtime publication — enable for conversaciones only.
alter publication supabase_realtime add table conversaciones;
