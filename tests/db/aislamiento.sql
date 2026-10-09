-- Pruebas de aislamiento por empresa. Falla (ON_ERROR_STOP) si algo no se comporta como se espera.
\set ON_ERROR_STOP on
grant select, insert, update, delete on all tables in schema public to authenticated;

insert into auth.users(id) values
  ('a0000000-0000-0000-0000-00000000000a'), ('b0000000-0000-0000-0000-00000000000b'),
  ('c0000000-0000-0000-0000-00000000000c'), ('d0000000-0000-0000-0000-00000000000d'),
  ('e0000000-0000-0000-0000-00000000000e');
insert into empresas(id, nombre, estado_suscripcion) values
  ('11111111-1111-1111-1111-111111111111', 'Empresa A', 'activa'),
  ('22222222-2222-2222-2222-222222222222', 'Empresa B', 'activa'),
  ('33333333-3333-3333-3333-333333333333', 'Empresa C (sin pago)', 'morosa');
insert into perfiles(user_id, rol, empresa_id) values
  ('a0000000-0000-0000-0000-00000000000a', 'empresa_admin', '11111111-1111-1111-1111-111111111111'),
  ('b0000000-0000-0000-0000-00000000000b', 'empresa_admin', '22222222-2222-2222-2222-222222222222'),
  ('c0000000-0000-0000-0000-00000000000c', 'organizador', null),
  ('d0000000-0000-0000-0000-00000000000d', 'empresa_admin', '33333333-3333-3333-3333-333333333333');
insert into rit_documentos(empresa_id, capitulo, contenido) values
  ('11111111-1111-1111-1111-111111111111', 'mod_1', '{"secreto":"A"}'),
  ('22222222-2222-2222-2222-222222222222', 'mod_1', '{"secreto":"B"}'),
  ('33333333-3333-3333-3333-333333333333', 'mod_1', '{"secreto":"C"}');

create or replace function pg_temp.como(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid, false);
  execute 'set role authenticated';
end $$;

create or replace function pg_temp.afirma(ok boolean, msg text) returns void language plpgsql as $$
begin if not ok then raise exception 'FALLO: %', msg; end if; raise notice 'ok: %', msg; end $$;

create or replace function pg_temp.falla(sentencia text, msg text) returns void language plpgsql as $$
begin
  begin execute sentencia; exception when others then raise notice 'ok: % (%)', msg, sqlerrm; return; end;
  raise exception 'FALLO: se permitió -> %', msg;
end $$;

-- Empresa A: ve solo lo suyo.
select pg_temp.como('a0000000-0000-0000-0000-00000000000a');
select pg_temp.afirma((select count(*) from rit_documentos) = 1, 'A ve 1 capítulo (el suyo)');
select pg_temp.afirma((select contenido->>'secreto' from rit_documentos) = 'A', 'A lee su propio contenido');
select pg_temp.afirma((select count(*) from empresas) = 1, 'A ve solo su empresa');
update rit_documentos set contenido = '{"secreto":"A2"}' where capitulo = 'mod_1';
select pg_temp.afirma((select contenido->>'secreto' from rit_documentos) = 'A2', 'A edita lo suyo (suscripción activa)');
select pg_temp.falla($q$insert into rit_documentos(empresa_id, capitulo) values ('22222222-2222-2222-2222-222222222222','mod_2')$q$, 'A no escribe en B');
select pg_temp.falla($q$insert into biblioteca_leyes(titulo, contenido) values ('x','y')$q$, 'empresa no publica leyes');
reset role;

-- Empresa B no ve a A.
select pg_temp.como('b0000000-0000-0000-0000-00000000000b');
select pg_temp.afirma((select count(*) from rit_documentos where contenido->>'secreto' like 'A%') = 0, 'B no ve el contenido de A');
reset role;

-- Empresa C: lee lo suyo pero no escribe (morosa).
select pg_temp.como('d0000000-0000-0000-0000-00000000000d');
select pg_temp.afirma((select count(*) from rit_documentos) = 1, 'C morosa aún lee su RIT');
select pg_temp.falla($q$insert into rit_documentos(empresa_id, capitulo) values ('33333333-3333-3333-3333-333333333333','mod_2')$q$, 'C morosa no escribe');
reset role;

-- Organizador: ninguna fila privada; sí empresas, biblioteca y recordatorios.
select pg_temp.como('c0000000-0000-0000-0000-00000000000c');
select pg_temp.afirma((select count(*) from rit_documentos) = 0, 'organizador no ve ningún capítulo');
select pg_temp.afirma((select count(*) from rit_versiones) = 0, 'organizador no ve versiones');
select pg_temp.afirma((select count(*) from checklist_igt) = 0, 'organizador no ve checklist');
select pg_temp.afirma((select count(*) from memoriales) = 0, 'organizador no ve memoriales');
select pg_temp.afirma((select count(*) from recordatorios_empresa) = 0, 'organizador no ve plazos de empresas');
select pg_temp.afirma((select count(*) from empresas) = 3, 'organizador lista las empresas');
select pg_temp.falla($q$insert into rit_documentos(empresa_id, capitulo) values ('11111111-1111-1111-1111-111111111111','mod_2')$q$, 'organizador no escribe RIT');
insert into biblioteca_leyes(titulo, referencia, contenido) values ('Código de Trabajo', 'Decreto 1441', 'texto');
insert into recordatorios_globales(titulo, fecha) values ('Revisión anual', '2027-01-15');
select pg_temp.afirma((select count(*) from biblioteca_leyes) = 1, 'organizador publica leyes');
reset role;

-- Las empresas leen lo que publica el organizador.
select pg_temp.como('a0000000-0000-0000-0000-00000000000a');
select pg_temp.afirma((select count(*) from biblioteca_leyes) = 1, 'empresa lee la biblioteca');
select pg_temp.afirma((select count(*) from recordatorios_globales) = 1, 'empresa lee recordatorios globales');
reset role;
