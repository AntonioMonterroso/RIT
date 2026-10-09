export type Tema = "claro" | "oscuro";

export const CLAVE_TEMA = "rit:tema";

/** Se ejecuta antes de pintar para que no haya parpadeo: aplica el tema guardado (claro por defecto). */
export const SCRIPT_TEMA = `(function(){try{var t=localStorage.getItem("${CLAVE_TEMA}");document.documentElement.dataset.tema=t==="oscuro"?"oscuro":"claro"}catch(e){document.documentElement.dataset.tema="claro"}})()`;

export function temaActual(): Tema {
  return typeof document !== "undefined" && document.documentElement.dataset.tema === "oscuro" ? "oscuro" : "claro";
}

export function aplicarTema(t: Tema): void {
  document.documentElement.dataset.tema = t;
  try { localStorage.setItem(CLAVE_TEMA, t); } catch { /* almacenamiento no disponible: el tema vale solo en esta visita */ }
}
