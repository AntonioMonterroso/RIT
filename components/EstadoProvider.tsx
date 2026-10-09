"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ESTADO_INICIAL, type EstadoRit } from "@/lib/almacen";
import { datos } from "@/lib/datos";
import { repositorioLocal, type Repositorio } from "@/lib/repositorio";
import { abrirRepositorio } from "@/lib/sesion";
import { construirAvisos, contarUrgentes, type Aviso } from "@/lib/avisos";
import type { Recordatorio } from "@/lib/biblioteca";

type Guardado = "" | "guardando" | "ok" | "error";

interface Contexto {
  estado: EstadoRit;
  /** Aplica un cambio y lo guarda automáticamente. */
  actualizar: (f: (s: EstadoRit) => EstadoRit) => void;
  listo: boolean;
  guardado: Guardado;
  avisos: Aviso[];
  urgentes: number;
}

const Ctx = createContext<Contexto | null>(null);

export function useRit(): Contexto {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRit debe usarse dentro de <EstadoProvider>");
  return c;
}

export default function EstadoProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoRit>(ESTADO_INICIAL);
  const [listo, setListo] = useState(false);
  const [guardado, setGuardado] = useState<Guardado>("");
  const [generales, setGenerales] = useState<Recordatorio[]>([]);
  const repo = useRef<Repositorio>(repositorioLocal);
  const ultimo = useRef(estado);
  const sucio = useRef(false);
  ultimo.current = estado;

  useEffect(() => {
    let vivo = true;
    (async () => {
      const r = await abrirRepositorio();
      if (!r) return router.replace("/acceso");
      repo.current = r;
      datos().listarRecordatorios().then((g) => vivo && setGenerales(g)).catch(() => {});
      try {
        const e = await r.cargar();
        if (vivo) { setEstado(e); setListo(true); }
      } catch {
        if (vivo) { setGuardado("error"); setListo(true); }
      }
    })();
    return () => { vivo = false; };
  }, [router]);

  const actualizar = useCallback((f: (s: EstadoRit) => EstadoRit) => {
    sucio.current = true;
    setEstado((s) => f(s));
  }, []);

  // Guardado automático con espera de 600 ms. Solo guarda si el usuario cambió algo.
  useEffect(() => {
    if (!listo || !sucio.current) return;
    const t = setTimeout(async () => {
      setGuardado("guardando");
      try { await repo.current.guardar(estado); sucio.current = false; setGuardado("ok"); } catch { setGuardado("error"); }
    }, 600);
    return () => clearTimeout(t);
  }, [estado, listo]);

  // Al cerrar o recargar la pestaña se guarda de inmediato lo pendiente.
  useEffect(() => {
    if (!listo) return;
    const volcar = () => { if (sucio.current) void repo.current.guardar(ultimo.current).catch(() => {}); };
    const oculto = () => document.visibilityState === "hidden" && volcar();
    window.addEventListener("pagehide", volcar);
    document.addEventListener("visibilitychange", oculto);
    return () => { window.removeEventListener("pagehide", volcar); document.removeEventListener("visibilitychange", oculto); };
  }, [listo]);

  const avisos = useMemo(() => construirAvisos(estado, generales), [estado, generales]);
  const valor = useMemo<Contexto>(
    () => ({ estado, actualizar, listo, guardado, avisos, urgentes: contarUrgentes(avisos) }),
    [estado, actualizar, listo, guardado, avisos],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
