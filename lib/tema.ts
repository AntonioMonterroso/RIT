export type Tema = "claro" | "oscuro";
export type Paleta = "arena" | "rosa" | "salvia";

export const CLAVE_TEMA = "rit:tema";
export const CLAVE_PALETA = "rit:paleta";

export const PALETAS: { id: Paleta; nombre: string; detalle: string; muestra: [string, string, string] }[] = [
  // Las muestras son solo la vista previa del selector (arena, apoyo y acento de cada paleta).
  { id: "arena", nombre: "Arena", detalle: "Arena cálida con salvia y rosa", muestra: ["#f6f1e8", "#cfa3ab", "#5f8670"] },
  { id: "rosa", nombre: "Rosa empolvado", detalle: "Rosa suave con salvia y arena", muestra: ["#f8eff0", "#a9c4b1", "#a06b7a"] },
  { id: "salvia", nombre: "Salvia", detalle: "Verde salvia con rosa y arena", muestra: ["#eff3ee", "#d5aab2", "#5a866c"] },
];

/** Se ejecuta antes de pintar para que no haya parpadeo: aplica el tema y la paleta guardados. */
export const SCRIPT_TEMA = `(function(){var d=document.documentElement;try{var t=localStorage.getItem("${CLAVE_TEMA}");var p=localStorage.getItem("${CLAVE_PALETA}");d.dataset.tema=t==="oscuro"?"oscuro":"claro";if(p==="rosa"||p==="salvia")d.dataset.paleta=p}catch(e){d.dataset.tema="claro"}})()`;

export function temaActual(): Tema {
  return typeof document !== "undefined" && document.documentElement.dataset.tema === "oscuro" ? "oscuro" : "claro";
}

export function paletaActual(): Paleta {
  const p = typeof document !== "undefined" ? document.documentElement.dataset.paleta : undefined;
  return p === "rosa" || p === "salvia" ? p : "arena";
}

function guardar(clave: string, valor: string) {
  try { localStorage.setItem(clave, valor); } catch { /* almacenamiento no disponible: vale solo en esta visita */ }
}

export function aplicarTema(t: Tema): void {
  document.documentElement.dataset.tema = t;
  guardar(CLAVE_TEMA, t);
}

export function aplicarPaleta(p: Paleta): void {
  if (p === "arena") delete document.documentElement.dataset.paleta; else document.documentElement.dataset.paleta = p;
  guardar(CLAVE_PALETA, p);
}
