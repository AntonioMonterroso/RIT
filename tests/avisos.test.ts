import { describe, expect, it } from "vitest";
import { construirAvisos, contarUrgentes } from "@/lib/avisos";
import { ESTADO_INICIAL } from "@/lib/almacen";

describe("avisos", () => {
  const estado = {
    ...ESTADO_INICIAL,
    publicacion: { fecha: "2026-10-09", medio: "fijacion" as const },
    recordatorios: [
      { id: "a", titulo: "Pagar planilla", fecha: "2026-10-12", hecho: false },
      { id: "b", titulo: "Ya hecho", fecha: "2026-10-10", hecho: true },
    ],
  };
  const generales = [{ id: "g", titulo: "Revisión anual", detalle: null, fecha: "2026-12-01" }];

  it("ordena por fecha e incluye la vigencia calculada", () => {
    const av = construirAvisos(estado, generales, "2026-10-09");
    expect(av.map((a) => a.clave)).toEqual(["propio:b", "propio:a", "vigencia", "general:g", "legal:aguinaldo1:2026", "legal:aguinaldo2:2027"]);
    expect(av.find((a) => a.clave === "vigencia")!.fecha).toBe("2026-10-24");
  });

  it("cuenta urgentes: vencidos y próximos 7 días, sin los hechos", () => {
    const av = construirAvisos(estado, generales, "2026-10-09");
    expect(contarUrgentes(av, "2026-10-09")).toBe(1); // solo "Pagar planilla"
    expect(contarUrgentes(av, "2026-10-20")).toBe(2); // + la vigencia del 24
    expect(contarUrgentes(av, "2027-01-01")).toBe(4); // todo vencido o próximo salvo el hecho y el aguinaldo de enero
  });

  it("sin publicación no hay aviso de vigencia", () => {
    expect(construirAvisos(ESTADO_INICIAL, [], "2026-10-09").some((a) => a.clave === "vigencia")).toBe(false);
  });
});
