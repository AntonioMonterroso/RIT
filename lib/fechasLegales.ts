import { aISO } from "@/lib/fechas";

/**
 * Fechas legales anuales que el sistema recuerda solo. Salen de las guías consultadas, no del texto oficial:
 * hasta que un abogado las valide se muestran con la leyenda «confirmar».
 */
export interface FechaLegal {
  clave: string;
  titulo: string;
  detalle: string;
  fecha: string;
}


export function fechasLegales(desde: string, dias = 400): FechaLegal[] {
  const inicio = new Date(`${desde}T12:00:00`);
  const fin = aISO(new Date(inicio.getTime() + dias * 86_400_000));
  const out: FechaLegal[] = [];
  for (let y = inicio.getFullYear(); y <= inicio.getFullYear() + 1; y++) {
    out.push(
      { clave: `legal:bono14:${y}`, titulo: `Pagar el Bono 14 (${y})`, detalle: "Bono 14, Decreto 42-92: un mes de salario, a pagar en la primera quincena de julio. Confirmar con su abogado o contador.", fecha: `${y}-07-15` },
      { clave: `legal:aguinaldo1:${y}`, titulo: `Aguinaldo: primera mitad (${y})`, detalle: "Aguinaldo, Decreto 76-78: 50% en la primera quincena de diciembre. Confirmar con su abogado o contador.", fecha: `${y}-12-15` },
      { clave: `legal:aguinaldo2:${y + 1}`, titulo: `Aguinaldo: segunda mitad (${y + 1})`, detalle: "Aguinaldo, Decreto 76-78: el 50% restante en enero. Las guías consultadas difieren entre el 15 y el 31 de enero: pague antes del 15 y confirme con su abogado o contador.", fecha: `${y + 1}-01-15` },
    );
  }
  return out.filter((f) => f.fecha >= desde && f.fecha <= fin).sort((a, b) => a.fecha.localeCompare(b.fecha));
}
