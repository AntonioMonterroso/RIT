-- RIT Guatemala: esquema inicial con aislamiento por empresa (RLS).
-- NO PROBADO contra una base real todavía: ejecutar primero en un proyecto de desarrollo y
-- correr las pruebas de aislamiento (ver README) antes de usarlo con datos reales.

create extension if not exists pgcrypto;

-- ───────── Tablas base ─────────
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  estado_suscripcion text not null default 'inactiva'
    check (estado_suscripcion in ('inactiva', 'activa', 'morosa', 'cancelada')),
  stripe_customer_id text unique,
  creada_en timestamptz not null default now()
);

create table public.perfiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  rol text not null check (rol in ('organizador', 'empresa_admin', 'empresa_miembro')),
  empresa_id uuid references public.empresas (id) on delete cascade,
  -- Las cuentas de empresa siempre pertenecen a una empresa; el organizador a ninguna.
  check ((rol = 'organizador') = (empresa_id is null))
);

-- ───────── Funciones auxiliares (security definer para evitar recursión de RLS) ─────────
create or replace function public.es_organizador() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where user_id = auth.uid() and rol = 'organizador');
$$;

create or replace function public.mi_empresa() returns uuid
language sql stable security definer set search_path = public as $$
  select empresa_id from perfiles where user_id = auth.uid();
$$;

create or replace function public.suscripcion_activa(eid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from empresas where id = eid and estado_suscripcion = 'activa');
$$;

-- ───────── Datos PRIVADOS de cada empresa ─────────
create table public.rit_documentos (
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  capitulo text not null check (capitulo in
    ('mod_1','mod_2','mod_3','mod_4','mod_5','mod_6','mod_7','mod_8','mod_9','mod_puestos')),
  contenido jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz not null default now(),
  primary key (empresa_id, capitulo)
);

create table public.rit_versiones (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  etiqueta text,
  snapshot jsonb not null,
  creada_en timestamptz not null default now()
);

create table public.checklist_igt (
  empresa_id uuid primary key references public.empresas (id) on delete cascade,
  manuales jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz not null default now()
);

create table public.memoriales (
  empresa_id uuid primary key references public.empresas (id) on delete cascade,
  datos jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz not null default now()
);

create table public.recordatorios_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  titulo text not null,
  fecha date not null,
  hecho boolean not null default false
);

-- ───────── Datos COMPARTIDOS (los publica el organizador) ─────────
create table public.biblioteca_leyes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  referencia text,            -- p. ej. "Decreto 1441", "Acuerdo Gubernativo 229-2014"
  contenido text not null,
  publicada_en timestamptz not null default now()
);

create table public.recordatorios_globales (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  detalle text,
  fecha date not null
);

-- ───────── RLS ─────────
alter table public.empresas enable row level security;
alter table public.perfiles enable row level security;
alter table public.rit_documentos enable row level security;
alter table public.rit_versiones enable row level security;
alter table public.checklist_igt enable row level security;
alter table public.memoriales enable row level security;
alter table public.recordatorios_empresa enable row level security;
alter table public.biblioteca_leyes enable row level security;
alter table public.recordatorios_globales enable row level security;

-- Perfiles: cada usuario ve el suyo. Las altas se hacen con service_role (sin política de escritura).
create policy perfiles_propio on public.perfiles for select using (user_id = auth.uid());

-- Empresas: la propia empresa y el organizador (solo nombre/estado; no hay datos del RIT aquí).
create policy empresas_lectura on public.empresas for select
  using (id = public.mi_empresa() or public.es_organizador());

-- Datos privados: SOLO la empresa dueña. El organizador tiene empresa_id nulo, así que
-- mi_empresa() no coincide con ninguna fila y no recibe nada.
-- Lectura siempre; escritura únicamente con suscripción activa.
do $$
declare t text;
begin
  foreach t in array array['rit_documentos','rit_versiones','checklist_igt','memoriales','recordatorios_empresa']
  loop
    execute format('create policy %I_leer on public.%I for select using (empresa_id = public.mi_empresa())', t, t);
    execute format(
      'create policy %I_escribir on public.%I for all
         using (empresa_id = public.mi_empresa() and public.suscripcion_activa(empresa_id))
         with check (empresa_id = public.mi_empresa() and public.suscripcion_activa(empresa_id))', t, t);
  end loop;
end $$;

-- Compartidos: lectura para cualquier usuario autenticado; escritura solo el organizador.
create policy biblioteca_leer on public.biblioteca_leyes for select to authenticated using (true);
create policy biblioteca_escribir on public.biblioteca_leyes for all
  using (public.es_organizador()) with check (public.es_organizador());

create policy recordatorios_globales_leer on public.recordatorios_globales for select to authenticated using (true);
create policy recordatorios_globales_escribir on public.recordatorios_globales for all
  using (public.es_organizador()) with check (public.es_organizador());
