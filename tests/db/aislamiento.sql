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
insert into empresa_datos(empresa_id, razon_social, nit) values
  ('11111111-1111-1111-1111-111111111111', 'Razon A', '111'),
  ('22222222-2222-2222-2222-222222222222', 'Razon B', '222');
insert into rit_configuracion(empresa_id, puestos) values ('11111111-1111-1111-1111-111111111111', '[{"nombre":"Secreto A"}]'), ('22222222-2222-2222-2222-222222222222', '[]');
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
select pg_temp.afirma((select count(*) from rit_configuracion) = 1, 'A ve solo su configuración');
update rit_documentos set contenido = '{"secreto":"A2"}' where capitulo = 'mod_1';
select pg_temp.afirma((select contenido->>'secreto' from rit_documentos) = 'A2', 'A edita lo suyo (suscripción activa)');
select pg_temp.falla($q$insert into rit_documentos(empresa_id, capitulo) values ('22222222-2222-2222-2222-222222222222','mod_2')$q$, 'A no escribe en B');
select pg_temp.falla($q$insert into biblioteca_leyes(titulo, contenido) values ('x','y')$q$, 'empresa no publica leyes');
reset role;

-- Empresa B no ve a A.
select pg_temp.como('b0000000-0000-0000-0000-00000000000b');
select pg_temp.afirma((select count(*) from rit_documentos where contenido->>'secreto' like 'A%') = 0, 'B no ve el contenido de A');
select pg_temp.afirma((select count(*) from rit_configuracion where puestos::text like '%Secreto A%') = 0, 'B no ve los puestos de A');
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
select pg_temp.afirma((select count(*) from empresa_datos) = 0, 'organizador no ve razón social, NIT ni representante');
select pg_temp.afirma((select count(*) from publicaciones) = 0, 'organizador no ve publicaciones');
select pg_temp.afirma((select count(*) from rit_configuracion) = 0, 'organizador no ve diagnóstico, puestos ni trámite');
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

-- Alta de empresa y periodo de prueba.
select pg_temp.como('e0000000-0000-0000-0000-00000000000e');
select pg_temp.afirma((select count(*) from empresas) = 0, 'usuario nuevo aún no ve empresas');
select pg_temp.falla($q$insert into empresas(nombre) values ('Intrusa')$q$, 'no se crea empresa por INSERT directo');
select pg_temp.falla($q$insert into perfiles(user_id, rol) values (auth.uid(), 'organizador')$q$, 'no se autoasigna rol de organizador');
select pg_temp.falla($q$select crear_empresa('x')$q$, 'nombre inválido rechazado');
select crear_empresa('Mi Empresa Nueva');
select pg_temp.afirma((select count(*) from empresas) = 1, 'tras el alta ve solo su empresa');
select pg_temp.afirma((select estado_suscripcion from empresas) = 'prueba', 'nace en periodo de prueba');
insert into rit_documentos(empresa_id, capitulo, contenido) values (mi_empresa(), 'mod_1', '{}');
select pg_temp.afirma((select count(*) from rit_documentos) = 1, 'en prueba puede escribir su RIT');
select pg_temp.falla($q$select crear_empresa('Otra Más')$q$, 'no puede crear una segunda empresa');
reset role;
select pg_temp.como('00000000-0000-0000-0000-000000000000');
select pg_temp.falla($q$select crear_empresa('Anonima')$q$, 'usuario sin sesión válida no crea empresa');
reset role;

-- ───────── Equipo: roles, aprobaciones, invitaciones ─────────
insert into auth.users(id) values
  ('f1000000-0000-0000-0000-0000000000f1'), ('f2000000-0000-0000-0000-0000000000f2'),
  ('f3000000-0000-0000-0000-0000000000f3'), ('f4000000-0000-0000-0000-0000000000f4'),
  ('f5000000-0000-0000-0000-0000000000f5');
insert into perfiles(user_id, rol, empresa_id, nombre) values
  ('f1000000-0000-0000-0000-0000000000f1', 'editor',  '11111111-1111-1111-1111-111111111111', 'Eva Editora'),
  ('f2000000-0000-0000-0000-0000000000f2', 'lector',  '11111111-1111-1111-1111-111111111111', 'Luis Lector'),
  ('f3000000-0000-0000-0000-0000000000f3', 'revisor', '11111111-1111-1111-1111-111111111111', 'Rosa Revisora');

-- Editor: escribe documentos, no aprueba ni invita.
select pg_temp.como('f1000000-0000-0000-0000-0000000000f1');
select pg_temp.afirma((select count(*) from rit_documentos) = 1, 'editor ve el RIT de su empresa');
update rit_documentos set contenido = '{"secreto":"A3"}' where capitulo = 'mod_1';
select pg_temp.afirma((select contenido->>'secreto' from rit_documentos) = 'A3', 'editor edita el RIT');
select pg_temp.falla($q$insert into aprobaciones(empresa_id, huella, nombre) values ('11111111-1111-1111-1111-111111111111', repeat('a',64), 'x')$q$, 'editor no aprueba');
select pg_temp.falla($q$select crear_invitacion('lector')$q$, 'editor no invita');
select pg_temp.falla($q$select cambiar_rol('f2000000-0000-0000-0000-0000000000f2', 'editor')$q$, 'editor no cambia roles');
select pg_temp.afirma((select count(*) from perfiles) >= 4, 'editor ve a su equipo');
reset role;

-- Lector: solo lectura.
select pg_temp.como('f2000000-0000-0000-0000-0000000000f2');
select pg_temp.afirma((select count(*) from rit_documentos) = 1, 'lector ve el RIT');
update rit_documentos set contenido = '{"secreto":"HACK"}' where capitulo = 'mod_1';
select pg_temp.afirma((select contenido->>'secreto' from rit_documentos) = 'A3', 'lector no logra editar (0 filas)');
select pg_temp.falla($q$insert into rit_documentos(empresa_id, capitulo) values ('11111111-1111-1111-1111-111111111111','mod_3')$q$, 'lector no inserta capítulos');
select pg_temp.falla($q$insert into aprobaciones(empresa_id, huella, nombre) values ('11111111-1111-1111-1111-111111111111', repeat('a',64), 'x')$q$, 'lector no aprueba');
reset role;

-- Revisor: aprueba, no edita; la aprobación es inmutable.
select pg_temp.como('f3000000-0000-0000-0000-0000000000f3');
select pg_temp.falla($q$insert into rit_documentos(empresa_id, capitulo) values ('11111111-1111-1111-1111-111111111111','mod_4')$q$, 'revisor no inserta capítulos');
insert into aprobaciones(empresa_id, etiqueta, huella, nombre, cargo) values ('11111111-1111-1111-1111-111111111111', 'v1', repeat('a',64), 'Rosa Revisora', 'Gerente RRHH');
select pg_temp.afirma((select count(*) from aprobaciones) = 1, 'revisor registra una aprobación');
select pg_temp.falla($q$insert into aprobaciones(empresa_id, huella, nombre) values ('11111111-1111-1111-1111-111111111111', 'no-es-sha', 'x')$q$, 'huella inválida rechazada');
select pg_temp.falla($q$insert into aprobaciones(empresa_id, huella, nombre, aprobado_por) values ('11111111-1111-1111-1111-111111111111', repeat('b',64), 'x', 'a0000000-0000-0000-0000-00000000000a')$q$, 'no se aprueba a nombre de otra persona');
update aprobaciones set nombre = 'Falsificado';
delete from aprobaciones;
select pg_temp.afirma((select nombre from aprobaciones) = 'Rosa Revisora', 'aprobación inmutable (UPDATE/DELETE no hacen nada)');
reset role;

-- Otra empresa y organizador no ven aprobaciones ni equipo.
select pg_temp.como('b0000000-0000-0000-0000-00000000000b');
select pg_temp.afirma((select count(*) from aprobaciones) = 0, 'B no ve aprobaciones de A');
select pg_temp.afirma((select count(*) from perfiles) = 1, 'B no ve el equipo de A');
reset role;
select pg_temp.como('c0000000-0000-0000-0000-00000000000c');
select pg_temp.afirma((select count(*) from aprobaciones) = 0, 'organizador no ve aprobaciones');
select pg_temp.afirma((select count(*) from invitaciones) = 0, 'organizador no ve invitaciones');
select pg_temp.afirma((select count(*) from perfiles where empresa_id is not null) = 0, 'organizador no ve miembros de empresas');
reset role;

-- Administrador: invita, cambia roles, protege al último admin.
select pg_temp.como('a0000000-0000-0000-0000-00000000000a');
create temp table cod as select crear_invitacion('editor') as c;
grant select on cod to authenticated;
select pg_temp.afirma((select length(c) from cod) = 10, 'admin crea invitación de 10 caracteres');
select pg_temp.falla($q$select crear_invitacion('organizador')$q$, 'no se invita como organizador');
select pg_temp.falla($q$select cambiar_rol('f2000000-0000-0000-0000-0000000000f2', 'organizador')$q$, 'no se asigna organizador');
select pg_temp.falla($q$select cambiar_rol('a0000000-0000-0000-0000-00000000000a', 'lector')$q$, 'no se degrada al último admin');
select pg_temp.falla($q$select quitar_miembro('a0000000-0000-0000-0000-00000000000a')$q$, 'no se quita al último admin');
select pg_temp.falla($q$select cambiar_rol('b0000000-0000-0000-0000-00000000000b', 'lector')$q$, 'no se cambia rol de otra empresa');
select cambiar_rol('f2000000-0000-0000-0000-0000000000f2', 'revisor');
select pg_temp.afirma((select rol from perfiles where user_id = 'f2000000-0000-0000-0000-0000000000f2') = 'revisor', 'admin cambia rol');
select quitar_miembro('f2000000-0000-0000-0000-0000000000f2');
select pg_temp.afirma((select count(*) from perfiles where user_id = 'f2000000-0000-0000-0000-0000000000f2') = 0, 'admin quita a una persona');
select pg_temp.afirma((select count(*) from invitaciones) = 1, 'admin ve sus invitaciones');
reset role;

-- B no ve las invitaciones de A.
select pg_temp.como('b0000000-0000-0000-0000-00000000000b');
select pg_temp.afirma((select count(*) from invitaciones) = 0, 'B no ve invitaciones de A');
reset role;

-- Aceptar invitación: una sola vez, solo sin perfil previo, con código vigente.
select pg_temp.como('f4000000-0000-0000-0000-0000000000f4');
select pg_temp.falla($q$select aceptar_invitacion('CODIGOFALSO', 'x')$q$, 'código inexistente rechazado');
select aceptar_invitacion((select c from cod), 'Nuevo Editor');
select pg_temp.afirma((select rol from perfiles where user_id = auth.uid()) = 'editor', 'el invitado entra con el rol de la invitación');
select pg_temp.afirma((select count(*) from rit_documentos) = 1, 'el invitado ve el RIT de la empresa');
reset role;
select pg_temp.como('f5000000-0000-0000-0000-0000000000f5');
select pg_temp.falla(format('select aceptar_invitacion(%L, ''x'')', (select c from cod)), 'un código no se usa dos veces');
reset role;
update invitaciones set expira_en = now() - interval '1 day';
select pg_temp.como('a0000000-0000-0000-0000-00000000000a');
create temp table cod2 as select crear_invitacion('lector') as c;
grant select on cod2 to authenticated;
reset role;
update invitaciones set expira_en = now() - interval '1 day' where codigo = (select c from cod2);
select pg_temp.como('f5000000-0000-0000-0000-0000000000f5');
select pg_temp.falla(format('select aceptar_invitacion(%L, ''x'')', (select c from cod2)), 'invitación vencida rechazada');
select pg_temp.falla($q$select aceptar_invitacion('x')$q$, 'código corto rechazado');
reset role;
select pg_temp.como('a0000000-0000-0000-0000-00000000000a');
select pg_temp.falla($q$select aceptar_invitacion('ABC', 'x')$q$, 'quien ya tiene empresa no acepta invitaciones');
reset role;

-- ───────── Prueba vencida: solo lectura; novedades legales ─────────
select pg_temp.como('e0000000-0000-0000-0000-00000000000e');
select pg_temp.afirma((select prueba_hasta > now() + interval '13 days' from empresas), 'la prueba dura 14 días');
reset role;
update empresas set prueba_hasta = now() - interval '1 hour' where nombre = 'Mi Empresa Nueva';
select pg_temp.como('e0000000-0000-0000-0000-00000000000e');
select pg_temp.afirma((select count(*) from rit_documentos) = 1, 'prueba vencida: sigue leyendo su RIT');
select pg_temp.falla($q$insert into rit_documentos(empresa_id, capitulo) values (mi_empresa(), 'mod_2')$q$, 'prueba vencida: no escribe');
select pg_temp.falla($q$select crear_invitacion('lector')$q$, 'prueba vencida: no invita');
reset role;

select pg_temp.como('c0000000-0000-0000-0000-00000000000c');
insert into novedades_legales(titulo, resumen, capitulo, texto_sugerido) values ('Reforma X', 'Resumen', 'mod_4', 'Texto sugerido');
reset role;
select pg_temp.como('a0000000-0000-0000-0000-00000000000a');
select pg_temp.afirma((select count(*) from novedades_legales) = 1, 'empresa lee novedades legales');
select pg_temp.falla($q$insert into novedades_legales(titulo, resumen) values ('x','y')$q$, 'empresa no publica novedades');
reset role;
