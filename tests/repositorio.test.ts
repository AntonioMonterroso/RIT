import { describe, expect, it } from "vitest";
import { repositorioSupabase, type ClienteDatos } from "@/lib/repositorio";
import { ESTADO_INICIAL } from "@/lib/almacen";

/** Doble en memoria que imita lo mínimo de PostgREST: select, maybeSingle y upsert. */
function falso(filas: Record<string, Record<string, unknown>[]> = {}) {
  const upserts: { tabla: string; fila: Record<string, unknown>; conflicto?: string }[] = [];
  const borrados: { tabla: string; id: unknown }[] = [];
  const db = {
    from(tabla: string) {
      const datos = filas[tabla] ?? [];
      const consulta = {
        select: () => consulta,
        maybeSingle: async () => ({ data: datos[0] ?? null, error: null }),
        then: (res: (v: unknown) => unknown) => res({ data: datos, error: null }),
        delete: () => ({ eq: async (_c: string, id: unknown) => { borrados.push({ tabla, id }); return { error: null }; } }),
        upsert: async (fila: Record<string, unknown>, o?: { onConflict?: string }) => {
          upserts.push({ tabla, fila, conflicto: o?.onConflict });
          return { error: null };
        },
      };
      return consulta;
    },
  } as unknown as ClienteDatos;
  return { db, upserts, borrados };
}

const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "hola" }] }] };

describe("repositorio Supabase", () => {
  it("carga y reconstruye el estado", async () => {
    const { db } = falso({
      rit_documentos: [{ capitulo: "mod_1", contenido: doc }],
      empresa_datos: [{ razon_social: "Comercial X", nit: "123" }],
      checklist_igt: [{ manuales: { A1: true } }],
      publicaciones: [{ fecha: "2026-10-09", medio: "ambos" }],
    });
    const s = await repositorioSupabase(db, "emp-1").cargar();
    expect(s.capitulos.mod_1).toEqual(doc);
    expect(s.empresa.razon_social).toBe("Comercial X");
    expect(s.empresa.departamento).toBe("Guatemala"); // valor por defecto conservado
    expect(s.manuales.A1).toBe(true);
    expect(s.publicacion).toEqual({ fecha: "2026-10-09", medio: "ambos" });
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
});
