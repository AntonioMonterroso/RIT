import type { SupabaseClient } from "@supabase/supabase-js";
import { CAPITULOS, type CapituloKey } from "@/content/capitulos";
import type { Aprobacion } from "@/lib/aprobaciones";
import { cargarBorrador, ESTADO_INICIAL, guardarBorrador, type EstadoRit, type NovedadesAtendidas, type RecordatorioPropio, type Rutina, type Version } from "@/lib/almacen";
import { MEMORIAL_INICIAL } from "@/lib/memorial";
import { DIAGNOSTICO_INICIAL, TRAMITE_INICIAL, type Diagnostico, type Puesto, type Tramite } from "@/lib/tipos";
import type { Nodo } from "@/lib/docx";

export interface Repositorio {
  cargar(): Promise<EstadoRit>;
  guardar(estado: EstadoRit): Promise<void>;
}

export const repositorioLocal: Repositorio = {
  async cargar() { return cargarBorrador(); },
  async guardar(estado) { guardarBorrador(estado); },
};

/** Subconjunto de SupabaseClient que usamos; permite probar con un doble sin red. */
export type ClienteDatos = Pick<SupabaseClient, "from">;

/**
 * Persistencia en Supabase. Todas las tablas están protegidas con RLS por empresa, así que
 * las consultas no filtran por `empresa_id` al leer: la base solo devuelve las filas propias.
 * Al escribir, `empresa_id` es obligatorio y la política verifica que coincida con el usuario.
 */
export function repositorioSupabase(db: ClienteDatos, empresaId: string): Repositorio {
  const ultimo = new Map<string, string>(); // última versión guardada, para no reescribir lo que no cambió

  const upsertSiCambio = async (tabla: string, clave: string, fila: Record<string, unknown>, conflicto: string) => {
    const firma = JSON.stringify(fila);
    if (ultimo.get(clave) === firma) return;
    const { error } = await db.from(tabla).upsert({ ...fila, actualizado_en: new Date().toISOString() }, { onConflict: conflicto });
    if (error) throw new Error(`No se pudo guardar ${tabla}: ${error.message}`);
    ultimo.set(clave, firma);
  };

  return {
    async cargar() {
      const [docs, datos, check, memo, pub, recs, conf, vers, apro] = await Promise.all([
        db.from("rit_documentos").select("capitulo, contenido"),
        db.from("empresa_datos").select("*").maybeSingle(),
        db.from("checklist_igt").select("manuales").maybeSingle(),
        db.from("memoriales").select("datos").maybeSingle(),
        db.from("publicaciones").select("fecha, medio").maybeSingle(),
        db.from("recordatorios_empresa").select("id, titulo, fecha, hecho"),
        db.from("rit_configuracion").select("diagnostico, puestos, tramite").maybeSingle(),
        db.from("rit_versiones").select("id, etiqueta, snapshot, creada_en").order("creada_en", { ascending: false }),
        db.from("aprobaciones").select("id, etiqueta, huella, nombre, cargo, nota, creada_en").order("creada_en", { ascending: false }),
      ]);
      for (const r of [docs, datos, check, memo, pub, recs, conf, vers, apro]) {
        if (r.error) throw new Error(`No se pudo cargar el RIT: ${r.error.message}`);
      }

      const capitulos: Partial<Record<CapituloKey, Nodo>> = {};
      for (const fila of (docs.data ?? []) as { capitulo: CapituloKey; contenido: Nodo }[]) {
        capitulos[fila.capitulo] = fila.contenido;
        ultimo.set(`doc:${fila.capitulo}`, JSON.stringify({ empresa_id: empresaId, capitulo: fila.capitulo, contenido: fila.contenido }));
      }
      const versiones: Version[] = ((vers.data ?? []) as { id: string; etiqueta: string | null; snapshot: Version["capitulos"]; creada_en: string }[])
        .map((v) => ({ id: v.id, etiqueta: v.etiqueta ?? "", fecha: v.creada_en, capitulos: v.snapshot }));
      for (const v of versiones) ultimo.set(`ver:${v.id}`, JSON.stringify({ empresa_id: empresaId, id: v.id, etiqueta: v.etiqueta, snapshot: v.capitulos, creada_en: v.fecha }));
      const propios = (recs.data ?? []) as RecordatorioPropio[];
      for (const r of propios) ultimo.set(`rec:${r.id}`, JSON.stringify({ empresa_id: empresaId, ...r }));
      const aprobaciones: Aprobacion[] = ((apro.data ?? []) as (Omit<Aprobacion, "fecha"> & { creada_en: string })[])
        .map(({ creada_en, ...a }) => ({ ...a, fecha: creada_en }));
      for (const a of aprobaciones) ultimo.set(`apr:${a.id}`, "guardada");
      const cfg = conf.data as { diagnostico?: Diagnostico; puestos?: Puesto[]; tramite?: Tramite; rutina?: Rutina; novedades?: NovedadesAtendidas } | null;
      const d = datos.data as Partial<EstadoRit["empresa"]> | null;
      return {
        ...ESTADO_INICIAL,
        empresa: { ...ESTADO_INICIAL.empresa, ...(d ?? {}) },
        capitulos,
        manuales: (check.data as { manuales: Record<string, boolean> } | null)?.manuales ?? {},
        memorial: { ...MEMORIAL_INICIAL, ...((memo.data as { datos: object } | null)?.datos ?? {}) },
        publicacion: {
          fecha: (pub.data as { fecha: string | null } | null)?.fecha ?? "",
          medio: ((pub.data as { medio: EstadoRit["publicacion"]["medio"] } | null)?.medio ?? ""),
        },
        recordatorios: propios,
        versiones,
        diagnostico: { ...DIAGNOSTICO_INICIAL, ...(cfg?.diagnostico ?? {}) },
        puestos: cfg?.puestos ?? [],
        tramite: { ...TRAMITE_INICIAL, ...(cfg?.tramite ?? {}) },
        aprobaciones,
        rutina: cfg?.rutina ?? {},
        novedades: cfg?.novedades ?? {},
        actualizado: null,
      };
    },

    async guardar(estado) {
      const e = estado.empresa;
      await upsertSiCambio("empresa_datos", "datos", {
        empresa_id: empresaId, razon_social: e.razon_social, nombre_comercial: e.nombre_comercial,
        nit: e.nit, representante_legal: e.representante_legal, departamento: e.departamento,
      }, "empresa_id");
      for (const c of CAPITULOS) {
        const contenido = estado.capitulos[c.key];
        if (!contenido) continue;
        await upsertSiCambio("rit_documentos", `doc:${c.key}`, { empresa_id: empresaId, capitulo: c.key, contenido }, "empresa_id,capitulo");
      }
      await upsertSiCambio("checklist_igt", "check", { empresa_id: empresaId, manuales: estado.manuales }, "empresa_id");
      await upsertSiCambio("memoriales", "memo", { empresa_id: empresaId, datos: estado.memorial }, "empresa_id");
      await upsertSiCambio("rit_configuracion", "conf", {
        empresa_id: empresaId, diagnostico: estado.diagnostico, puestos: estado.puestos, tramite: estado.tramite,
        rutina: estado.rutina, novedades: estado.novedades,
      }, "empresa_id");
      await upsertSiCambio("publicaciones", "pub", {
        empresa_id: empresaId, fecha: estado.publicacion.fecha || null, medio: estado.publicacion.medio,
      }, "empresa_id");
      // Versiones: se escriben las nuevas y se borran las eliminadas (las versiones no se editan).
      const idsVer = new Set(estado.versiones.map((v) => v.id));
      for (const clave of [...ultimo.keys()]) {
        if (!clave.startsWith("ver:") || idsVer.has(clave.slice(4))) continue;
        const { error } = await db.from("rit_versiones").delete().eq("id", clave.slice(4));
        if (error) throw new Error(`No se pudo guardar rit_versiones: ${error.message}`);
        ultimo.delete(clave);
      }
      for (const v of estado.versiones) {
        await upsertSiCambio("rit_versiones", `ver:${v.id}`, { empresa_id: empresaId, id: v.id, etiqueta: v.etiqueta, snapshot: v.capitulos, creada_en: v.fecha }, "id");
      }

      // Aprobaciones: solo se insertan las nuevas. La base no permite editarlas ni borrarlas.
      for (const a of estado.aprobaciones) {
        if (ultimo.has(`apr:${a.id}`)) continue;
        const { error } = await db.from("aprobaciones").insert({
          id: a.id, empresa_id: empresaId, etiqueta: a.etiqueta, huella: a.huella, nombre: a.nombre, cargo: a.cargo, nota: a.nota, creada_en: a.fecha,
        });
        if (error) throw new Error(`No se pudo guardar aprobaciones: ${error.message}`);
        ultimo.set(`apr:${a.id}`, "guardada");
      }

      // Recordatorios propios: se escriben los nuevos o editados y se borran los eliminados.
      const vigentes = new Set(estado.recordatorios.map((r) => r.id));
      for (const clave of [...ultimo.keys()]) {
        if (!clave.startsWith("rec:") || vigentes.has(clave.slice(4))) continue;
        const { error } = await db.from("recordatorios_empresa").delete().eq("id", clave.slice(4));
        if (error) throw new Error(`No se pudo guardar recordatorios_empresa: ${error.message}`);
        ultimo.delete(clave);
      }
      for (const r of estado.recordatorios) {
        await upsertSiCambio("recordatorios_empresa", `rec:${r.id}`, { empresa_id: empresaId, id: r.id, titulo: r.titulo, fecha: r.fecha, hecho: r.hecho }, "id");
      }
    },
  };
}
