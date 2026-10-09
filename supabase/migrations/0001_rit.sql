-- RIT Guatemala: esquema completo con aislamiento por empresa (RLS). Una sola migración.
-- Probado contra Postgres 16 local (tests/db). Aún NO ejecutado en un proyecto Supabase real:
-- córralo primero en un proyecto de desarrollo.

create extension if not exists pgcrypto;

-- ───────── Tablas base ─────────
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  estado_suscripcion text not null default 'inactiva'
    check (estado_suscripcion in ('prueba', 'activa', 'morosa', 'cancelada', 'inactiva')),
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
  select exists (select 1 from empresas where id = eid and estado_suscripcion in ('activa', 'prueba'));
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
  hecho boolean not null default false,
  actualizado_en timestamptz not null default now()
);

create table public.empresa_datos (
  empresa_id uuid primary key references public.empresas (id) on delete cascade,
  razon_social text not null default '',
  nombre_comercial text not null default '',
  nit text not null default '',
  representante_legal text not null default '',
  departamento text not null default 'Guatemala',
  actualizado_en timestamptz not null default now()
);

create table public.publicaciones (
  empresa_id uuid primary key references public.empresas (id) on delete cascade,
  fecha date,
  medio text not null default '' check (medio in ('', 'fijacion', 'folleto', 'ambos')),
  actualizado_en timestamptz not null default now()
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
alter table public.empresa_datos enable row level security;
alter table public.publicaciones enable row level security;
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
  foreach t in array array['rit_documentos','rit_versiones','checklist_igt','memoriales','recordatorios_empresa','empresa_datos','publicaciones']
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

-- Alta de empresa: un usuario autenticado sin perfil crea su empresa y queda como administrador.
-- No hay política de INSERT sobre empresas/perfiles; esta es la única vía desde el cliente.
create or replace function public.crear_empresa(p_nombre text) returns uuid
language plpgsql security definer set search_path = public as $$
declare nueva uuid;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if exists (select 1 from perfiles where user_id = auth.uid()) then
    raise exception 'El usuario ya pertenece a una empresa';
  end if;
  if length(btrim(coalesce(p_nombre, ''))) < 2 then raise exception 'Nombre de empresa inválido'; end if;
  insert into empresas (nombre, estado_suscripcion) values (btrim(p_nombre), 'prueba') returning id into nueva;
  insert into perfiles (user_id, rol, empresa_id) values (auth.uid(), 'empresa_admin', nueva);
  insert into empresa_datos (empresa_id, razon_social) values (nueva, btrim(p_nombre));
  return nueva;
end $$;

revoke all on function public.crear_empresa(text) from public;
grant execute on function public.crear_empresa(text) to authenticated;
