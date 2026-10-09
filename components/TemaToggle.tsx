"use client";

import { useEffect, useState } from "react";
import { aplicarTema, temaActual, type Tema } from "@/lib/tema";
import { Icono } from "./Iconos";

/** Interruptor Porcelana (claro) / Pizarra (oscuro). */
export default function TemaToggle() {
  const [tema, setTema] = useState<Tema>("claro");
  useEffect(() => { setTema(temaActual()); }, []);
  const alternar = () => { const t: Tema = tema === "claro" ? "oscuro" : "claro"; aplicarTema(t); setTema(t); };
  const aOscuro = tema === "claro";
  return (
    <button type="button" onClick={alternar} aria-label={aOscuro ? "Cambiar a tema oscuro" : "Cambiar a tema claro"} title={aOscuro ? "Tema oscuro" : "Tema claro"}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line text-brand-700 transition-colors hover:bg-velo2">
      <Icono nombre={aOscuro ? "luna" : "sol"} className="h-4 w-4" />
    </button>
  );
}
