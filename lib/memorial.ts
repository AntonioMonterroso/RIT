import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";

export interface DatosMemorial {
  autoridad: string;
  rep_nombre: string;
  rep_datos: string;
  rep_dpi: string;
  calidad: string;
  razon_social: string;
  nombre_comercial: string;
  direccion: string;
  lugar_fecha: string;
}

export const MEMORIAL_INICIAL: DatosMemorial = {
  autoridad:
    "SEÑOR INSPECTOR GENERAL DE TRABAJO, INSPECCIÓN GENERAL DE TRABAJO, MINISTERIO DE TRABAJO Y PREVISIÓN SOCIAL DE GUATEMALA.",
  rep_nombre: "",
  rep_datos: "",
  rep_dpi: "",
  calidad: "Gerente General y Representante Legal",
  razon_social: "",
  nombre_comercial: "",
  direccion: "",
  lugar_fecha: "",
};

const F = "Times New Roman";
const dato = (v: string, ph: string) => v.trim() || `[${ph}]`;

const run = (text: string, o: { bold?: boolean; italics?: boolean } = {}) =>
  new TextRun({ text, font: F, size: 24, ...o });

function parrafo(children: TextRun[], o: { sangria?: number; centrado?: boolean } = {}) {
  return new Paragraph({
    children,
    alignment: o.centrado ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    indent: { firstLine: o.sangria ?? 720 },
    spacing: { after: 200, line: 360 },
  });
}

export function construirMemorial(d: DatosMemorial): Document {
  const rep = dato(d.rep_nombre, "NOMBRE DEL REPRESENTANTE LEGAL");
  const razon = dato(d.razon_social, "RAZÓN SOCIAL");
  const comercial = dato(d.nombre_comercial, "NOMBRE COMERCIAL");
  const calidad = dato(d.calidad, "CALIDAD CON QUE ACTÚA");

  const hijos = [
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 300 },
      children: [run(d.autoridad.toUpperCase(), { bold: true })],
    }),
    parrafo([
      run("Yo, "), run(rep, { bold: true }),
      run(`, de ${dato(d.rep_datos, "EDAD, ESTADO CIVIL Y PROFESIÓN")}, me identifico con el Documento Personal de Identificación (DPI) con Código Único de Identificación número ${dato(d.rep_dpi, "DPI")}; actúo en mi calidad de `),
      run(calidad, { bold: true }),
      run(" de la entidad denominada "), run(razon, { bold: true }),
      run(", propietaria de la empresa comercial denominada \""), run(comercial, { bold: true }),
      run(`", calidad que acredito con la fotocopia simple de mi nombramiento debidamente inscrito en el Registro Mercantil General de la República; señalo como lugar para recibir notificaciones la sede ubicada en: ${dato(d.direccion, "DIRECCIÓN DE NOTIFICACIÓN")}. Ante usted respetuosamente comparezco y:`),
    ]),
    parrafo([run("EXPONGO:", { bold: true })], { sangria: 0 }),
    parrafo([
      run("I. DEL MOTIVO DE LA SOLICITUD: ", { bold: true }),
      run("Mi representada, con el objeto de regular en forma clara y justa las relaciones de trabajo, jornadas, derechos, obligaciones, normas de higiene, seguridad ocupacional y régimen disciplinario entre el patrono y sus colaboradores, ha elaborado el proyecto de "),
      run("REGLAMENTO INTERIOR DE TRABAJO", { bold: true }), run(" correspondiente a la entidad que represento."),
    ]),
    parrafo([
      run("II. DEL CUMPLIMIENTO LEGAL: ", { bold: true }),
      run("El referido proyecto se ha estructurado conforme a lo dispuesto en los artículos 57, 58, 59 y 60 del Código de Trabajo de Guatemala (Decreto 1441 del Congreso de la República) y la normativa complementaria aplicable."),
    ]),
    parrafo([
      run("III. DOCUMENTACIÓN QUE SE ACOMPAÑA: ", { bold: true }),
      run("Adjunto al presente memorial:"),
    ]),
    ...[
      "a) Dos ejemplares impresos del proyecto de Reglamento Interior de Trabajo;",
      "b) Fotocopia simple del nombramiento que acredita mi representación legal;",
      "c) Fotocopia simple de la Patente de Comercio de Sociedad y de Empresa;",
      "d) Fotocopia simple de mi Documento Personal de Identificación (DPI); y",
      "e) Constancia que acredita el número de trabajadores de la empresa (planilla del IGSS o Informe Anual del Empleador).",
    ].map((t) => parrafo([run(t)], { sangria: 360 })),
    parrafo([run("PETICIÓN:", { bold: true })], { sangria: 0 }),
    ...[
      "1. Se admita para su trámite el presente memorial y los documentos adjuntos, incorporándolos al expediente respectivo.",
      "2. Se tenga por acreditada la personería con que actúo y por señalado el lugar para recibir notificaciones.",
      "3. Se proceda a la revisión técnica del proyecto de Reglamento Interior de Trabajo.",
      `4. Cumplidos los requisitos legales, se emita la resolución que declare APROBADO el Reglamento Interior de Trabajo de la entidad ${razon}.`,
    ].map((t) => parrafo([run(t)])),
    parrafo([run("Acompaño tres copias del presente memorial y de los documentos adjuntos.")]),
    parrafo([run(`${dato(d.lugar_fecha, "LUGAR Y FECHA")}.`)]),
    new Paragraph({ children: [], spacing: { before: 1200 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [run("f. ______________________________")] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [run(rep, { bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [run(calidad)] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [run(razon)] }),
  ];

  return new Document({
    creator: razon,
    title: "Memorial de solicitud de aprobación de RIT",
    styles: { default: { document: { run: { font: F, size: 24 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      children: hijos,
    }],
  });
}

export const generarMemorialBlob = (d: DatosMemorial) => Packer.toBlob(construirMemorial(d));
export const generarMemorialBuffer = (d: DatosMemorial) => Packer.toBuffer(construirMemorial(d));
