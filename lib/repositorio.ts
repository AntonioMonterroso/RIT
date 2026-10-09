import type { SupabaseClient } from "@supabase/supabase-js";
import { CAPITULOS, type CapituloKey } from "@/content/capitulos";
import { cargarBorrador, ESTADO_INICIAL, guardarBorrador, type EstadoRit, type RecordatorioPropio } from "@/lib/almacen";
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
      const [docs, datos, check, memo, pub, recs, conf] = await Promise.all([
        db.from("rit_documentos").select("capitulo, contenido"),
        db.from("empresa_datos").select("*").maybeSingle(),
        db.from("checklist_igt").select("manuales").maybeSingle(),
        db.from("memoriales").select("datos").maybeSingle(),
        db.from("publicaciones").select("fecha, medio").maybeSingle(),
        db.from("recordatorios_empresa").select("id, titulo, fecha, hecho"),
        db.from("rit_configuracion").select("diagnostico, puestos, tramite").maybeSingle(),
      ]);
      for (const r of [docs, datos, check, memo, pub, recs, conf]) {
        if (r.error) throw new Error(`No se pudo cargar el RIT: ${r.error.message}`);
      }

      const capitulos: Partial<Record<CapituloKey, Nodo>> = {};
      for (const fila of (docs.data ?? []) as { capitulo: CapituloKey; contenido: Nodo }[]) {
        capitulos[fila.capitulo] = fila.contenido;
        ultimo.set(`doc:${fila.capitulo}`, JSON.stringify({ empresa_id: empresaId, capitulo: fila.capitulo, contenido: fila.contenido }));
      }
      const propios = (recs.data ?? []) as RecordatorioPropio[];
      for (const r of propios) ultimo.set(`rec:${r.id}`, JSON.stringify({ empresa_id: empresaId, ...r }));
      const cfg = conf.data as { diagnostico?: Diagnostico; puestos?: Puesto[]; tramite?: Tramite } | null;
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
        diagnostico: { ...DIAGNOSTICO_INICIAL, ...(cfg?.diagnostico ?? {}) },
        puestos: cfg?.puestos ?? [],
        tramite: { ...TRAMITE_INICIAL, ...(cfg?.tramite ?? {}) },
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
      }, "empresa_id");
      await upsertSiCambio("publicaciones", "pub", {
        empresa_id: empresaId, fecha: estado.publicacion.fecha || null, medio: estado.publicacion.medio,
      }, "empresa_id");
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
