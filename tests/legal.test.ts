import { describe, expect, it } from "vitest";
import { alertasDeCapitulo, alertasLegales } from "@/lib/legal";
import { generarBorrador } from "@/lib/generador";
import { ESTADO_INICIAL } from "@/lib/almacen";
import { GIROS } from "@/lib/tipos";
import { documento, textoANodos } from "@/lib/texto";

const doc = (t: string) => documento(textoANodos(t));
const reglas = (t: string) => alertasDeCapitulo("mod_4", doc(t)).map((a) => a.regla);

describe("verificador legal", () => {
  it("detecta cifras por debajo del mínimo", () => {
    expect(reglas("El trabajador gozará de 10 días hábiles de vacaciones por cada año.")).toContain("vacaciones-minimas");
    expect(reglas("Las vacaciones serán de 12 días por año de servicio.")).toContain("vacaciones-minimas");
    expect(reglas("La jornada es de 48 horas semanales.")).toContain("jornada-semanal");
    expect(reglas("La jornada ordinaria diurna será de 10 horas diarias.")).toContain("jornada-diurna");
    expect(reglas("Las horas extraordinarias se pagarán con un recargo del 25%.")).toContain("recargo-extra");
    expect(reglas("El período de prueba será de 3 meses.")).toContain("periodo-prueba");
    expect(reglas("El aguinaldo será del 50% del salario.")).toContain("aguinaldo-bono14");
  });
  it("no alerta con cifras iguales o superiores al mínimo", () => {
    expect(reglas("Vacaciones de 15 días hábiles. Jornada de 44 horas semanales. Jornada diurna de 8 horas diarias.")).toEqual([]);
    expect(reglas("Las horas extraordinarias se pagan con recargo del 50%. El período de prueba es de 2 meses. Aguinaldo del 100%.")).toEqual([]);
  });
  it("marca expresiones delicadas para revisión", () => {
    expect(reglas("Se aplicará una multa al trabajador que llegue tarde.")).toContain("multas-descuentos");
    expect(reglas("Se podrá despedir a quien esté en estado de embarazo sin más trámite.")).toContain("embarazo-despido");
    expect(reglas("Está prohibido descontar multas o sanciones económicas del salario.")).not.toContain("multas-descuentos");
    expect(reglas("El puesto es solo para hombres.")).toContain("discriminacion");
    expect(reglas("El despido de una trabajadora en embarazo requiere autorización previa de la autoridad de trabajo.")).not.toContain("embarazo-despido");
  });
  it("cada alerta trae su base legal sin validar y el extracto", () => {
    const [a] = alertasDeCapitulo("mod_4", doc("Vacaciones de 5 días."));
    expect(a.norma.articulo).toBe("130");
    expect(a.norma.validada).toBe(false);
    expect(a.extracto).toContain("5 días");
  });
  for (const g of GIROS) {
    it(`el borrador generado para ${g.id} no genera ninguna alerta legal`, () => {
      const { capitulos } = generarBorrador({ empresa: { ...ESTADO_INICIAL.empresa, razon_social: "X, S.A." }, diagnostico: { ...ESTADO_INICIAL.diagnostico, giro: g.id, teletrabajo: true, turnos: true, manejaEfectivo: true, usaVehiculos: true, uniforme: true, epp: true }, puestos: [] });
      expect(alertasLegales(capitulos)).toEqual([]); // ni contradicciones ni expresiones a revisar
    });
  }
});
