import { describe, expect, it } from "vitest";
import { diasHabilesEntre, esHabil, feriadosGT, fechaVigencia, pascua, sumarDiasHabiles } from "@/lib/fechas";

describe("fechas Guatemala", () => {
  it("calcula la Pascua", () => {
    expect(pascua(2025)).toBe("2025-04-20");
    expect(pascua(2026)).toBe("2026-04-05");
  });

  it("incluye Semana Santa y feriados fijos", () => {
    const f = feriadosGT(2026);
    for (const d of ["2026-04-02", "2026-04-03", "2026-04-04", "2026-01-01", "2026-05-01", "2026-06-30", "2026-09-15", "2026-10-20", "2026-11-01", "2026-12-25"]) {
      expect(f.has(d)).toBe(true);
    }
    expect(f.has("2026-12-24")).toBe(false);
  });

  it("no cuenta fines de semana ni feriados", () => {
    expect(esHabil("2026-10-10")).toBe(false); // sábado
    expect(esHabil("2026-10-20")).toBe(false); // feriado (martes)
    expect(esHabil("2026-10-21")).toBe(true);
  });

  it("cuenta días hábiles entre fechas", () => {
    // lun 5 oct -> vie 9 oct: martes a viernes = 4
    expect(diasHabilesEntre("2026-10-05", "2026-10-09")).toBe(4);
    // salta el feriado del 20 de octubre
    expect(diasHabilesEntre("2026-10-19", "2026-10-21")).toBe(1);
  });

  it("suma días hábiles y fija el borde de 20 días", () => {
    const limite = sumarDiasHabiles("2026-10-05", 20);
    expect(diasHabilesEntre("2026-10-05", limite)).toBe(20);
  });

  it("la vigencia es 15 días después de la publicidad", () => {
    expect(fechaVigencia("2026-10-09")).toBe("2026-10-24");
  });
});
