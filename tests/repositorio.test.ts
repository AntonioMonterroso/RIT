import { describe, expect, it } from "vitest";
import { repositorioSupabase, type ClienteDatos } from "@/lib/repositorio";
import { ESTADO_INICIAL } from "@/lib/almacen";

/** Doble en memoria que imita lo mínimo de PostgREST: select, maybeSingle y upsert. */
function falso(filas: Record<string, Record<string, unknown>[]> = {}) {
  const upserts: { tabla: string; fila: Record<string, unknown>; conflicto?: string }[] = [];
  const borrados: { tabla: string; id: unknown }[] = [];
  const inserts: { tabla: string; fila: Record<string, unknown> }[] = [];
  const db = {
    from(tabla: string) {
      const datos = filas[tabla] ?? [];
      const consulta = {
        select: () => consulta,
        order: () => consulta,
        maybeSingle: async () => ({ data: datos[0] ?? null, error: null }),
        then: (res: (v: unknown) => unknown) => res({ data: datos, error: null }),
        delete: () => ({ eq: async (_c: string, id: unknown) => { borrados.push({ tabla, id }); return { error: null }; } }),
        insert: async (fila: Record<string, unknown>) => { inserts.push({ tabla, fila }); return { error: null }; },
        upsert: async (fila: Record<string, unknown>, o?: { onConflict?: string }) => {
          upserts.push({ tabla, fila, conflicto: o?.onConflict });
          return { error: null };
        },
      };
      return consulta;
    },
  } as unknown as ClienteDatos;
  return { db, upserts, borrados, inserts };
}

const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "hola" }] }] };

describe("repositorio Supabase", () => {
  it("carga y reconstruye el estado", async () => {
    const { db } = falso({
      rit_documentos: [{ capitulo: "mod_1", contenido: doc }],
      empresa_datos: [{ razon_social: "Comercial X", nit: "123" }],
      checklist_igt: [{ manuales: { A1: true } }],
      publicaciones: [{ fecha: "2026-10-09", medio: "ambos" }],
      rit_configuracion: [{ diagnostico: { giro: "restaurante" }, puestos: [{ id: "p1", nombre: "Cajero" }], tramite: { estado: "presentado" } }],
    });
    const s = await repositorioSupabase(db, "emp-1").cargar();
    expect(s.capitulos.mod_1).toEqual(doc);
    expect(s.empresa.razon_social).toBe("Comercial X");
    expect(s.empresa.departamento).toBe("Guatemala"); // valor por defecto conservado
    expect(s.manuales.A1).toBe(true);
    expect(s.publicacion).toEqual({ fecha: "2026-10-09", medio: "ambos" });
    expect(s.diagnostico.giro).toBe("restaurante");
    expect(s.diagnostico.tolerancia).toBe(10); // por defecto conservado
    expect(s.puestos).toHaveLength(1);
    expect(s.tramite.estado).toBe("presentado");
  });

  it("guarda con empresa_id y clave de conflicto, y solo lo que cambió", async () => {
    const { db, upserts } = falso();
    const repo = repositorioSupabase(db, "emp-1");
    const estado = { ...ESTADO_INICIAL, capitulos: { mod_1: doc } };
    await repo.guardar(estado);
    const cap = upserts.find((u) => u.tabla === "rit_documentos")!;
    expect(cap.fila).toMatchObject({ empresa_id: "emp-1", capitulo: "mod_1" });
    expect(cap.conflicto).toBe("empresa_id,capitulo");
    expect(upserts.every((u) => u.fila.empresa_id === "emp-1")).toBe(true);

    const antes = upserts.length;
    await repo.guardar(estado); // sin cambios: no debe escribir nada
    expect(upserts.length).toBe(antes);

    await repo.guardar({ ...estado, capitulos: { mod_1: { ...doc, content: [] } } });
    expect(upserts.length).toBe(antes + 1);
  });

  it("no guarda capítulos que nunca se escribieron", async () => {
    const { db, upserts } = falso();
    await repositorioSupabase(db, "emp-1").guardar(ESTADO_INICIAL);
    expect(upserts.some((u) => u.tabla === "rit_documentos")).toBe(false);
  });

  it("propaga errores de la base", async () => {
    const db = { from: () => ({ upsert: async () => ({ error: { message: "rls" } }) }) } as unknown as ClienteDatos;
    await expect(repositorioSupabase(db, "e").guardar(ESTADO_INICIAL)).rejects.toThrow(/rls/);
  });

  it("guarda, edita y borra recordatorios propios", async () => {
    const { db, upserts, borrados } = falso({ recordatorios_empresa: [{ id: "r1", titulo: "Viejo", fecha: "2026-11-01", hecho: false }] });
    const repo = repositorioSupabase(db, "emp-1");
    const s0 = await repo.cargar();
    expect(s0.recordatorios).toEqual([{ id: "r1", titulo: "Viejo", fecha: "2026-11-01", hecho: false }]);

    await repo.guardar(s0); // sin cambios
    expect(upserts.some((u) => u.tabla === "recordatorios_empresa")).toBe(false);

    await repo.guardar({ ...s0, recordatorios: [{ ...s0.recordatorios[0], hecho: true }, { id: "r2", titulo: "Nuevo", fecha: "2026-12-01", hecho: false }] });
    const rec = upserts.filter((u) => u.tabla === "recordatorios_empresa");
    expect(rec).toHaveLength(2);
    expect(rec.every((u) => u.fila.empresa_id === "emp-1" && u.conflicto === "id")).toBe(true);

    await repo.guardar({ ...s0, recordatorios: [] });
    expect(borrados.map((b) => b.id).sort()).toEqual(["r1", "r2"]);
  });

  it("guarda y borra versiones del texto", async () => {
    const snap = { mod_1: doc };
    const { db, upserts, borrados } = falso({ rit_versiones: [{ id: "v1", etiqueta: "Primera", snapshot: snap, creada_en: "2026-10-09T10:00:00Z" }] });
    const repo = repositorioSupabase(db, "emp-1");
    const s0 = await repo.cargar();
    expect(s0.versiones).toEqual([{ id: "v1", etiqueta: "Primera", fecha: "2026-10-09T10:00:00Z", capitulos: snap }]);

    await repo.guardar(s0); // sin cambios
    expect(upserts.some((u) => u.tabla === "rit_versiones")).toBe(false);

    const nueva = { id: "v2", etiqueta: "Segunda", fecha: "2026-10-10T10:00:00Z", capitulos: snap };
    await repo.guardar({ ...s0, versiones: [nueva, ...s0.versiones] });
    const v = upserts.filter((u) => u.tabla === "rit_versiones");
    expect(v).toHaveLength(1);
    expect(v[0].fila).toMatchObject({ empresa_id: "emp-1", id: "v2", etiqueta: "Segunda", snapshot: snap });
    expect(v[0].conflicto).toBe("id");

    await repo.guardar({ ...s0, versiones: [] });
    expect(borrados.filter((b) => b.tabla === "rit_versiones").map((b) => b.id).sort()).toEqual(["v1", "v2"]);
  });

  it("las aprobaciones solo se insertan, una vez, y nunca se reescriben", async () => {
    const previa = { id: "a1", etiqueta: "v1", huella: "a".repeat(64), nombre: "Ana", cargo: "G", nota: "", creada_en: "2026-10-01T10:00:00Z" };
    const { db, upserts, inserts } = falso({ aprobaciones: [previa] });
    const repo = repositorioSupabase(db, "emp-1");
    const s0 = await repo.cargar();
    expect(s0.aprobaciones).toEqual([{ id: "a1", etiqueta: "v1", huella: "a".repeat(64), nombre: "Ana", cargo: "G", nota: "", fecha: "2026-10-01T10:00:00Z" }]);

    await repo.guardar(s0);
    expect(inserts).toHaveLength(0); // la ya guardada no se vuelve a enviar

    const nueva = { id: "a2", etiqueta: "v2", huella: "b".repeat(64), nombre: "Luis", cargo: "", nota: "", fecha: "2026-10-09T10:00:00Z" };
    const s1 = { ...s0, aprobaciones: [nueva, ...s0.aprobaciones] };
    await repo.guardar(s1);
    await repo.guardar(s1);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].fila).toMatchObject({ empresa_id: "emp-1", id: "a2", huella: "b".repeat(64), creada_en: "2026-10-09T10:00:00Z" });
    expect(upserts.some((u) => u.tabla === "aprobaciones")).toBe(false);
  });

  it("guarda la rutina y las novedades dentro de la configuración", async () => {
    const { db, upserts } = falso({ rit_configuracion: [{ rutina: { "2026-10": { hechos: { planilla: true }, cerrada: null } }, novedades: { n1: { estado: "aplicada", fecha: "2026-10-05T00:00:00Z" } } }] });
    const repo = repositorioSupabase(db, "emp-1");
    const s = await repo.cargar();
    expect(s.rutina["2026-10"].hechos.planilla).toBe(true);
    expect(s.novedades.n1.estado).toBe("aplicada");
    await repo.guardar({ ...s, rutina: {} });
    expect(upserts.find((u) => u.tabla === "rit_configuracion")!.fila).toMatchObject({ rutina: {}, novedades: s.novedades });
  });
});
