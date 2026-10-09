import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { ESTADO_INICIAL, type EstadoRit } from "@/lib/almacen";
import { calcularPlan, resumenValor } from "@/lib/plan";
import { hechasEn, marcarTarea, mesDe, racha, TAREAS_RUTINA } from "@/lib/rutina";
import { aplicarNovedad, descartarNovedad, estadoNovedad, pendientes, yaIncluida, type Novedad } from "@/lib/novedades";
import { bitacora } from "@/lib/bitacora";
import { salud } from "@/lib/salud";
import { informeCumplimiento } from "@/lib/informe";
import { Packer } from "docx";
import { clausulaANodos, documento, textoPlano } from "@/lib/texto";

const ahora = new Date("2026-10-09T12:00:00Z");
const nov: Novedad = {
  id: "n1", titulo: "Trabajo a distancia", resumen: "r", capitulo: "mod_3", vigente_desde: null, publicada_en: "2026-09-01T00:00:00Z",
  texto_sugerido: "El trabajo a distancia se regirá por el horario y las obligaciones de este reglamento.",
};
const base: EstadoRit = { ...ESTADO_INICIAL, capitulos: { mod_3: documento(clausulaANodos("Horario", "Texto del horario de trabajo de la empresa.", 1)) } };

describe("plan y periodo de prueba", () => {
  it("prueba vigente, vencida y activa", () => {
    expect(calcularPlan("prueba", "2026-10-20T12:00:00Z", ahora)).toMatchObject({ fase: "prueba", diasRestantes: 11, soloLectura: false });
    expect(calcularPlan("prueba", "2026-10-08T12:00:00Z", ahora)).toMatchObject({ fase: "vencida", soloLectura: true });
    expect(calcularPlan("activa", null, ahora)).toMatchObject({ fase: "activa", soloLectura: false });
    expect(calcularPlan("morosa", null, ahora).soloLectura).toBe(true);
    expect(calcularPlan("cancelada", null, ahora).soloLectura).toBe(true);
  });
  it("resume lo construido", () => {
    expect(resumenValor(base).articulos).toBe(1);
  });
});

describe("rutina mensual", () => {
  it("el mes se cierra solo cuando todas las tareas están hechas y se puede reabrir", () => {
    let s = base;
    const mes = mesDe(ahora);
    for (const t of TAREAS_RUTINA) s = marcarTarea(s, mes, t.id, true, ahora);
    expect(hechasEn(s, mes)).toBe(TAREAS_RUTINA.length);
    expect(s.rutina[mes].cerrada).not.toBeNull();
    s = marcarTarea(s, mes, TAREAS_RUTINA[0].id, false, ahora);
    expect(s.rutina[mes].cerrada).toBeNull();
  });
  it("cuenta la racha de meses seguidos, también cruzando de año", () => {
    const cerrado = { hechos: {}, cerrada: "2026-01-02T00:00:00Z" };
    const s = { ...base, rutina: { "2026-01": cerrado, "2025-12": cerrado, "2025-11": cerrado, "2025-09": cerrado } };
    expect(racha(s, new Date("2026-01-15T12:00:00"))).toBe(3);
    expect(racha(s, new Date("2026-02-15T12:00:00"))).toBe(3); // febrero aún abierto: la racha de enero sigue
    expect(racha(s, new Date("2026-03-15T12:00:00"))).toBe(0);
  });
});

describe("novedades legales", () => {
  it("aplicar respalda, agrega el artículo numerado, deja recordatorio y marca la novedad", () => {
    const s = aplicarNovedad(base, nov, ahora);
    expect(s.versiones[0].etiqueta).toContain("Antes de novedad");
    const texto = textoPlano(s.capitulos.mod_3);
    expect(texto).toContain("Artículo 2. Trabajo a distancia");
    expect(texto).toContain("El trabajo a distancia se regirá");
    expect(estadoNovedad(s, nov)).toBe("aplicada");
    expect(s.recordatorios[0]).toMatchObject({ fecha: "2026-10-16", hecho: false });
    expect(s.recordatorios[0].titulo).toContain("IGT");
    expect(pendientes(s, [nov])).toHaveLength(0);
  });
  it("no se aplica dos veces ni se descarta lo ya aplicado", () => {
    const s = aplicarNovedad(base, nov, ahora);
    expect(aplicarNovedad(s, nov, ahora)).toBe(s);
    expect(descartarNovedad(s, nov, ahora)).toBe(s);
  });
  it("detecta que el texto ya lo cubre", () => {
    expect(yaIncluida(base, nov)).toBe(false);
    expect(yaIncluida(aplicarNovedad(base, nov, ahora), nov)).toBe(true);
  });
  it("descartar no toca el texto", () => {
    const s = descartarNovedad(base, nov, ahora);
    expect(s.capitulos).toBe(base.capitulos);
    expect(estadoNovedad(s, nov)).toBe("descartada");
  });
});

describe("salud, bitácora e informe", () => {
  it("la salud sube al atender cada control", () => {
    const a = salud(base, [nov], ahora);
    expect(a.indicadores.find((i) => i.id === "novedades")!.ok).toBe(false);
    const b = salud(descartarNovedad(base, nov, ahora), [nov], ahora);
    expect(b.indicadores.find((i) => i.id === "novedades")!.ok).toBe(true);
    expect(b.puntos).toBeGreaterThan(a.puntos);
  });
  it("la bitácora reúne eventos de todo el sistema, del más reciente al más antiguo", () => {
    const s: EstadoRit = {
      ...base,
      versiones: [{ id: "v", etiqueta: "Primera", fecha: "2026-09-01T10:00:00Z", capitulos: {} }],
      aprobaciones: [{ id: "a", etiqueta: "v1", huella: "a".repeat(64), nombre: "Ana", cargo: "Gerente", nota: "", fecha: "2026-09-10T10:00:00Z" }],
      tramite: { ...base.tramite, fechaPresentacion: "2026-09-20", expediente: "9-2026" },
      publicacion: { fecha: "2026-10-01", medio: "ambos" },
      rutina: { "2026-09": { hechos: {}, cerrada: "2026-09-30T10:00:00Z" } },
      novedades: { n1: { estado: "aplicada", fecha: "2026-10-05T10:00:00Z" } },
    };
    const ev = bitacora(s, [nov]);
    expect(ev.map((e) => e.tipo)).toEqual(["novedad", "publicacion", "rutina", "tramite", "aprobacion", "version"]);
    expect(ev.find((e) => e.tipo === "tramite")!.texto).toContain("9-2026");
    expect(ev.find((e) => e.tipo === "novedad")!.texto).toContain("Trabajo a distancia");
  });
  it("el informe es un .docx con salud, criterios y bitácora", async () => {
    const buf = await Packer.toBuffer(informeCumplimiento(aplicarNovedad(base, nov, ahora), [nov], ahora));
    const xml = (await (await JSZip.loadAsync(buf)).file("word/document.xml")!.async("string")).replace(/<[^>]+>/g, " ");
    expect(xml).toContain("INFORME DE CUMPLIMIENTO");
    expect(xml).toContain("Bitácora de cumplimiento");
    expect(xml).toContain("Novedad aplicada");
    expect(xml).toContain("No constituye dictamen legal");
  });
});
