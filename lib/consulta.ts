/**
 * Lee un parámetro de la URL. Funciona con la dirección normal (?cap=x) y con la del archivo
 * independiente de demostración, donde la ruta va en el hash (#/editor?cap=x).
 */
export function leerParametro(nombre: string): string | null {
  if (typeof window === "undefined") return null;
  const normal = new URLSearchParams(window.location.search).get(nombre);
  if (normal) return normal;
  const hash = window.location.hash;
  const i = hash.indexOf("?");
  return i >= 0 ? new URLSearchParams(hash.slice(i + 1)).get(nombre) : null;
}
