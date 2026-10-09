import { beforeEach, describe, expect, it } from "vitest";
import { datosLocal } from "@/lib/datos";

// localStorage mínimo para el entorno de pruebas (Node).
beforeEach(() => {
  const m = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k), clear: () => m.clear(), key: () => null, length: 0,
  } as Storage;
});

describe("datos locales", () => {
  it("publica y retira leyes, ordenadas por título", async () => {
    await datosLocal.publicarLey({ titulo: "Zeta", referencia: "", contenido: "z" });
    await datosLocal.publicarLey({ titulo: "Alfa", referencia: "D-1", contenido: "a" });
    const l = await datosLocal.listarLeyes();
    expect(l.map((x) => x.titulo)).toEqual(["Alfa", "Zeta"]);
    expect(l[1].referencia).toBeNull();
    await datosLocal.retirarLey(l[0].id);
    expect((await datosLocal.listarLeyes()).map((x) => x.titulo)).toEqual(["Zeta"]);
  });

  it("ordena los recordatorios por fecha", async () => {
    await datosLocal.publicarRecordatorio({ titulo: "B", detalle: "", fecha: "2027-02-01" });
    await datosLocal.publicarRecordatorio({ titulo: "A", detalle: "x", fecha: "2027-01-01" });
    expect((await datosLocal.listarRecordatorios()).map((r) => r.titulo)).toEqual(["A", "B"]);
  });

  it("lista la empresa local con estado de prueba", async () => {
    const e = await datosLocal.listarEmpresas();
    expect(e).toHaveLength(1);
    expect(e[0].estado_suscripcion).toBe("prueba");
  });
});
