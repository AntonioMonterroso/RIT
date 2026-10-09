/**
 * Nombre de archivo seguro para descargar: sin acentos ni símbolos, con guiones bajos.
 * Algunos navegadores descartan el nombre si trae caracteres no ASCII y guardan «download»
 * sin extensión, lo que impide abrir el Word con doble clic.
 */
export function nombreArchivo(base: string, extension: string): string {
  const limpio = base
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/_+/g, "_").replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 80);
  return `${limpio || "documento"}.${extension.replace(/^\./, "")}`;
}
