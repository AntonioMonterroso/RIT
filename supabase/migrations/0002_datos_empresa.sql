-- Datos de la empresa y publicidad como tablas PRIVADAS (el organizador solo ve nombre y estado
-- en `empresas`), alta de empresa para usuarios nuevos y estado de prueba.

alter table public.empresas drop constraint empresas_estado_suscripcion_check;
alter table public.empresas add constraint empresas_estado_suscripcion_check
  check (estado_suscripcion in ('prueba', 'activa', 'morosa', 'cancelada', 'inactiva'));

-- Escribir requiere suscripción activa o periodo de prueba.
create or replace function public.suscripcion_activa(eid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from empresas where id = eid and estado_suscripcion in ('activa', 'prueba'));
$$;

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

alter table public.empresa_datos enable row level security;
alter table public.publicaciones enable row level security;

do $$
declare t text;
begin
  foreach t in array array['empresa_datos', 'publicaciones']
  loop
    execute format('create policy %I_leer on public.%I for select using (empresa_id = public.mi_empresa())', t, t);
    execute format(
      'create policy %I_escribir on public.%I for all
         using (empresa_id = public.mi_empresa() and public.suscripcion_activa(empresa_id))
         with check (empresa_id = public.mi_empresa() and public.suscripcion_activa(empresa_id))', t, t);
  end loop;
end $$;

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
