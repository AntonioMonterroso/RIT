import { z } from "zod";
import { fusionar, type EstadoRit } from "@/lib/almacen";

const VERSION = 1;

export function exportarRespaldo(e: EstadoRit): string {
  return JSON.stringify({ app: "rit-guatemala", version: VERSION, exportado: new Date().toISOString(), estado: e }, null, 2);
}

const esquema = z.object({
  app: z.literal("rit-guatemala"),
  version: z.number().int().max(VERSION),
  estado: z.object({
    empresa: z.object({}).passthrough().optional(),
    capitulos: z.record(z.string(), z.unknown()).optional(),
  }).passthrough(),
});

export type ResultadoImportar = { ok: true; estado: EstadoRit } | { ok: false; error: string };

export function importarRespaldo(texto: string): ResultadoImportar {
  let crudo: unknown;
  try { crudo = JSON.parse(texto); } catch { return { ok: false, error: "El archivo no es un JSON válido." }; }
  const r = esquema.safeParse(crudo);
  if (!r.success) return { ok: false, error: "El archivo no es un respaldo de RIT Guatemala (o es de una versión más nueva)." };
  return { ok: true, estado: fusionar(r.data.estado as Partial<EstadoRit>) };
}
