// Guías de cumplimiento complementarias al RIT. No afirman umbrales ni plazos que no se hayan podido
// confirmar contra el texto oficial; remiten al texto vigente. REQUIEREN VALIDACIÓN DE UN ABOGADO
// (aparecen en el panel de revisión legal como «otros:sso» y «otros:rerit»).

export interface ItemGuia { id: string; texto: string; ayuda?: string }

/** Seguridad y salud ocupacional: Reglamento de SSO (Acuerdo Gubernativo 229-2014 y sus reformas). */
export const SSO_ITEMS: ItemGuia[] = [
  { id: "sso:plan-corresponde", texto: "Verifiqué en el reglamento vigente qué plan de salud y seguridad ocupacional corresponde a mi empresa según su número de trabajadores.", ayuda: "El reglamento distingue el plan según el tamaño del centro de trabajo. Consulte la versión consolidada, con sus reformas." },
  { id: "sso:plan", texto: "Elaboré el plan de salud y seguridad ocupacional (o de prevención de riesgos laborales) de cada lugar de trabajo." },
  { id: "sso:registro", texto: "Verifiqué si el plan debe inscribirse ante el Ministerio de Trabajo o el IGSS y, de ser así, lo inscribí.", ayuda: "Las guías consultadas indican que los planes se inscriben; confirme el procedimiento actual." },
  { id: "sso:comite", texto: "Constituí el comité bipartito de salud y seguridad ocupacional cuando corresponde, con igual número de representantes del patrono y de los trabajadores.", ayuda: "La integración y funcionamiento de los comités se detalla en el Acuerdo Ministerial 486-2023. Confirme si su empresa está obligada." },
  { id: "sso:capacitacion", texto: "Capacité al personal en salud y seguridad ocupacional y conservé constancia." },
  { id: "sso:epp", texto: "Entregué el equipo de protección personal que requieren los puestos y conservé constancia de entrega." },
  { id: "sso:emergencias", texto: "Definí el plan de emergencias y evacuación y realicé simulacros." },
  { id: "sso:rit", texto: "El capítulo de seguridad e higiene de mi reglamento remite al Reglamento de SSO y a mi plan." },
];

export const SSO_FUENTES = [
  "Acuerdo Gubernativo 229-2014, Reglamento de Salud y Seguridad Ocupacional",
  "Reformas: Acuerdo Gubernativo 33-2016 y 57-2022",
  "Acuerdo Ministerial 486-2023 (comités bipartitos)",
];

export const SSO_NOTA = "El sistema no determina qué plan o comité le corresponde: eso depende del texto vigente del reglamento y de sus reformas, que cambiaron en 2016 y 2022. Consulte la versión consolidada que publica el Ministerio de Trabajo, o a su abogado.";

/** Presentación del reglamento ante la Inspección General de Trabajo (portal RERIT). */
export const RERIT_PASOS: string[] = [
  "Cree la cuenta de patrono en el portal del Ministerio de Trabajo (Registro Electrónico de Reglamento Interior de Trabajo, RERIT).",
  "Complete el formulario de solicitud.",
  "Cargue los documentos de soporte y el reglamento en Word y en PDF.",
  "Firma el propietario o el representante legal.",
  "Dé seguimiento a la solicitud y descargue la resolución. Si la IGT emite un previo, corrija y presente de nuevo.",
  "Con la aprobación, dé a conocer el reglamento a los trabajadores: debe regir 15 días después y colocarse en al menos dos sitios visibles.",
];

export const RERIT_DOCS: ItemGuia[] = [
  { id: "rerit:patente", texto: "Patente de comercio de empresa (o de sociedad)." },
  { id: "rerit:rtu", texto: "Registro Tributario Unificado (RTU) de la empresa." },
  { id: "rerit:nombramiento", texto: "Nombramiento vigente del representante legal, inscrito en el Registro Mercantil." },
  { id: "rerit:dpi", texto: "DPI del representante legal." },
  { id: "rerit:planilla", texto: "Planilla del IGSS o constancia que acredite 10 o más trabajadores." },
  { id: "rerit:word", texto: "Reglamento en Word (.docx), descargado desde el sistema." },
  { id: "rerit:pdf", texto: "Reglamento en PDF (use «Imprimir / PDF» en la Vista previa)." },
];

export const RERIT_NOTA = "Pasos y documentos tomados de guías de terceros publicadas entre 2021 y 2026; el Ministerio puede modificarlos. Confirme en el portal oficial antes de presentar. El plazo de resolución no está confirmado (una guía menciona 30 días hábiles).";

/** Plazo referencial (días hábiles) para dar seguimiento a una solicitud presentada. No es un plazo legal confirmado. */
export const DIAS_SEGUIMIENTO_REFERENCIAL = 30;
