import { describe, expect, it } from "vitest";
import { clasificarJornada, diasDeLaSemana, evaluarJornada } from "@/lib/jornada";

describe("jornada", () => {
  it("clasifica diurna, mixta y nocturna", () => {
    expect(clasificarJornada("08:00", "17:00")).toBe("diurna");
    expect(clasificarJornada("06:00", "18:00")).toBe("diurna");
    expect(clasificarJornada("13:00", "20:00")).toBe("mixta"); // 2 h nocturnas
    expect(clasificarJornada("14:00", "22:00")).toBe("nocturna"); // 4 h nocturnas
    expect(clasificarJornada("22:00", "05:00")).toBe("nocturna"); // cruza medianoche
  });

  it("cuenta los días de la semana", () => {
    expect(diasDeLaSemana("lunes a viernes")).toBe(5);
    expect(diasDeLaSemana("Lunes a sábado")).toBe(6);
    expect(diasDeLaSemana("martes, jueves y domingo")).toBe(3);
  });

  it("una jornada diurna de oficina cumple el límite", () => {
    const r = evaluarJornada({ entrada: "08:00", salida: "17:00", almuerzoMin: 60, almuerzoComputa: false, diasLaborales: "lunes a viernes" });
    expect(r.tipo).toBe("diurna");
    expect(r.horasDiarias).toBe(8);
    expect(r.horasSemanales).toBe(40);
    expect(r.ok).toBe(true);
  });

  it("detecta exceso semanal en lunes a sábado de 8 horas", () => {
    const r = evaluarJornada({ entrada: "08:00", salida: "17:00", almuerzoMin: 60, almuerzoComputa: false, diasLaborales: "lunes a sábado" });
    expect(r.horasSemanales).toBe(48);
    expect(r.excedeSemanal).toBe(true);
    expect(r.ok).toBe(false);
    expect(r.mensajes.join(" ")).toMatch(/44/);
  });

  it("aplica límites menores a la jornada nocturna", () => {
    const r = evaluarJornada({ entrada: "20:00", salida: "05:00", almuerzoMin: 60, almuerzoComputa: false, diasLaborales: "lunes a viernes" });
    expect(r.tipo).toBe("nocturna");
    expect(r.excedeDiario).toBe(true); // 8 h efectivas > 6
  });
});
