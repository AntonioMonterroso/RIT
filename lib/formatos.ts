import { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { fechaVigencia } from "@/lib/fechas";
import { falta } from "@/content/plantillas";
import type { EstadoRit } from "@/lib/almacen";

const F = "Times New Roman";
const run = (text: string, o: { bold?: boolean; size?: number } = {}) => new TextRun({ text, font: F, size: o.size ?? 24, bold: o.bold });
const p = (text: string, o: { centro?: boolean; negrita?: boolean; despues?: number } = {}) =>
  new Paragraph({ alignment: o.centro ? AlignmentType.CENTER : AlignmentType.JUSTIFIED, spacing: { after: o.despues ?? 200, line: 340 }, children: [run(text, { bold: o.negrita })] });

const largo = (iso: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "[COMPLETAR: fecha]";
  const [y, m, d] = iso.split("-").map(Number);
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${d} de ${meses[m - 1]} de ${y}`;
};

const nombreEmpresa = (e: EstadoRit) => falta(e.empresa.razon_social || e.empresa.nombre_comercial, "razón social");

function documento(hijos: (Paragraph | Table)[], titulo: string) {
  return new Document({
    title: titulo,
    styles: { default: { document: { run: { font: F, size: 24 } } } },
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children: hijos }],
  });
}

export interface Formato {
  id: string;
  titulo: string;
  uso: string;
  cuando: string;
  generar: (e: EstadoRit) => Document;
}

const celda = (t: string, ancho: number, negrita = false) =>
  new TableCell({ width: { size: ancho, type: WidthType.PERCENTAGE }, margins: { top: 100, bottom: 100, left: 80, right: 80 }, children: [new Paragraph({ children: [run(t, { bold: negrita, size: 22 })] })] });

export const FORMATOS: Formato[] = [
  {
    id: "constancia", titulo: "Constancia de recibo del Reglamento (hoja de firmas)",
    uso: "Cada trabajador firma que recibió su ejemplar. Es la prueba principal de que el reglamento se dio a conocer.",
    cuando: "Al entregar el folleto, durante los 15 días previos a la vigencia.",
    generar: (e) => {
      const vig = e.publicacion.fecha ? fechaVigencia(e.publicacion.fecha) : "";
      const filas = Array.from({ length: 15 }, (_, i) => new TableRow({ children: [celda(String(i + 1), 6), celda("", 34), celda("", 20), celda("", 20), celda("", 20)] }));
      return documento([
        p(nombreEmpresa(e).toUpperCase(), { centro: true, negrita: true }),
        p("CONSTANCIA DE RECIBO DEL REGLAMENTO INTERIOR DE TRABAJO", { centro: true, negrita: true }),
        p(`Los trabajadores abajo firmantes hacemos constar que recibimos un ejemplar del Reglamento Interior de Trabajo de la empresa, aprobado por la Inspección General de Trabajo, que entrará en vigencia el ${vig ? largo(vig) : "[COMPLETAR: fecha de vigencia]"}, y que conocemos su contenido.`),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ tableHeader: true, children: [celda("No.", 6, true), celda("Nombre completo", 34, true), celda("DPI", 20, true), celda("Fecha de recibo", 20, true), celda("Firma", 20, true)] }), ...filas] }),
      ], "Constancia de recibo del RIT");
    },
  },
  {
    id: "acta", titulo: "Acta de divulgación y fijación del Reglamento",
    uso: "Deja constancia de que se fijaron ejemplares en dos sitios visibles del centro de trabajo.",
    cuando: "El día en que se fijan los ejemplares.",
    generar: (e) => documento([
      p(nombreEmpresa(e).toUpperCase(), { centro: true, negrita: true }),
      p("ACTA DE DIVULGACIÓN DEL REGLAMENTO INTERIOR DE TRABAJO", { centro: true, negrita: true }),
      p(`En ${falta(e.empresa.departamento, "departamento")}, el ${largo(e.publicacion.fecha)}, constituidos en las instalaciones de ${nombreEmpresa(e)}, ${falta(e.empresa.representante_legal, "representante legal")}, en su calidad de representante legal, hace constar que, habiéndose aprobado el Reglamento Interior de Trabajo por la Inspección General de Trabajo${e.tramite.expediente ? ` (expediente ${e.tramite.expediente})` : ""}, se procedió a fijar ejemplares impresos y legibles del mismo en los siguientes sitios visibles del centro de trabajo:`),
      p("1. ______________________________________________"),
      p("2. ______________________________________________"),
      p("Asimismo, se hace constar que dicho Reglamento entrará en vigencia quince días después de esta fecha, conforme al artículo 59 del Código de Trabajo."),
      p("No habiendo más que hacer constar, se firma la presente acta."),
      new Paragraph({ spacing: { before: 900 }, alignment: AlignmentType.CENTER, children: [run("f. ______________________________")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [run(falta(e.empresa.representante_legal, "representante legal"), { bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [run("Representante legal")] }),
    ], "Acta de divulgación del RIT"),
  },
  {
    id: "comunicado", titulo: "Comunicado al personal",
    uso: "Aviso interno para anunciar que el reglamento fue aprobado y cuándo comienza a regir.",
    cuando: "El primer día de la publicidad.",
    generar: (e) => {
      const vig = e.publicacion.fecha ? fechaVigencia(e.publicacion.fecha) : "";
      return documento([
        p(nombreEmpresa(e).toUpperCase(), { centro: true, negrita: true }),
        p("COMUNICADO AL PERSONAL", { centro: true, negrita: true }),
        p(`${falta(e.empresa.departamento, "departamento")}, ${largo(e.publicacion.fecha)}`),
        p("A todos los trabajadores:", { negrita: true }),
        p(`Les informamos que el Reglamento Interior de Trabajo de ${nombreEmpresa(e)} ha sido aprobado por la Inspección General de Trabajo y se pone en su conocimiento. Cada trabajador recibirá un ejemplar y firmará una constancia de recibo; además, se han fijado ejemplares en sitios visibles del centro de trabajo.`),
        p(`El Reglamento entrará en vigencia el ${vig ? largo(vig) : "[COMPLETAR: fecha de vigencia]"}, quince días después de esta comunicación. Los invitamos a leerlo con atención y a dirigir sus consultas a su jefe inmediato o al área de personal.`),
        p("Atentamente,"),
        new Paragraph({ spacing: { before: 700 }, children: [run(falta(e.empresa.representante_legal, "representante legal"), { bold: true })] }),
        new Paragraph({ children: [run("Representante legal")] }),
      ], "Comunicado al personal");
    },
  },
  {
    id: "reforma", titulo: "Solicitud de aprobación de reformas",
    uso: "Cuando modifique el reglamento ya aprobado: memorial breve dirigido a la IGT.",
    cuando: "Antes de aplicar cualquier cambio al reglamento vigente.",
    generar: (e) => documento([
      p("SEÑOR INSPECTOR GENERAL DE TRABAJO, INSPECCIÓN GENERAL DE TRABAJO, MINISTERIO DE TRABAJO Y PREVISIÓN SOCIAL DE GUATEMALA.", { negrita: true }),
      p(`Yo, ${falta(e.memorial.rep_nombre || e.empresa.representante_legal, "representante legal")}, actuando en mi calidad de representante legal de ${nombreEmpresa(e)}, señalo como lugar para recibir notificaciones: ${falta(e.memorial.direccion, "dirección")}. Ante usted respetuosamente comparezco y:`),
      p("EXPONGO:", { negrita: true }),
      p(`Que mi representada cuenta con Reglamento Interior de Trabajo aprobado${e.tramite.expediente ? ` en el expediente ${e.tramite.expediente}` : ""}, y que, por las razones que se detallan en el documento adjunto, es necesario reformar los artículos: [COMPLETAR: artículos a reformar y motivo].`),
      p("PETICIÓN:", { negrita: true }),
      p("1. Se admita para su trámite el presente memorial y el proyecto de reformas adjunto."),
      p("2. Se proceda a la revisión técnica de las reformas propuestas."),
      p("3. Cumplidos los requisitos legales, se emita la resolución que apruebe las reformas al Reglamento Interior de Trabajo."),
      p(`${falta(e.memorial.lugar_fecha, "lugar y fecha")}.`),
      new Paragraph({ spacing: { before: 900 }, alignment: AlignmentType.CENTER, children: [run("f. ______________________________")] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [run(falta(e.memorial.rep_nombre || e.empresa.representante_legal, "representante legal"), { bold: true })] }),
    ], "Solicitud de reformas al RIT"),
  },
];

export const generarFormatoBlob = (f: Formato, e: EstadoRit) => Packer.toBlob(f.generar(e));
export const generarFormatoBuffer = (f: Formato, e: EstadoRit) => Packer.toBuffer(f.generar(e));
