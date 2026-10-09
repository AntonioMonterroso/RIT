"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ESTADO_INICIAL, type EstadoRit } from "@/lib/almacen";
import { datos } from "@/lib/datos";
import { repositorioLocal, type Repositorio } from "@/lib/repositorio";
import { abrirSesion, fijarRolDemo } from "@/lib/sesion";
import { puede, type Accion, type Rol } from "@/lib/equipo";
import { calcularPlan, type InfoPlan } from "@/lib/plan";
import type { Novedad } from "@/lib/novedades";
import type { Validacion } from "@/lib/validables";
import { construirAvisos, contarUrgentes, type Aviso } from "@/lib/avisos";
import type { Recordatorio } from "@/lib/biblioteca";

type Guardado = "" | "guardando" | "ok" | "error";

interface Contexto {
  estado: EstadoRit;
  /** Aplica un cambio y lo guarda automáticamente. */
  actualizar: (f: (s: EstadoRit) => EstadoRit, accion?: Accion) => void;
  listo: boolean;
  guardado: Guardado;
  avisos: Aviso[];
  urgentes: number;
  rol: Rol;
  /** Sin cuentas: el rol se puede cambiar para ver cómo trabaja cada persona del equipo. */
  local: boolean;
  cambiarRolDemo: (r: Rol) => void;
  plan: InfoPlan;
  refrescarPlan: () => Promise<void>;
  novedades: Novedad[];
  /** Constancias de revisión legal del contenido (solo lectura). */
  validaciones: Validacion[];
  /** Verdadero si la persona puede hacer `accion` ahora (según su rol y el plan). */
  permitido: (accion: Accion) => boolean;
  /** Por qué no puede modificar, o null si puede. */
  motivoLectura: string | null;
  /** Mensaje breve cuando se intentó un cambio bloqueado. */
  bloqueo: string;
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
  const [rol, setRol] = useState<Rol>("empresa_admin");
  const [local, setLocal] = useState(true);
  const [plan, setPlan] = useState<InfoPlan>(() => calcularPlan("prueba", null));
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [validaciones, setValidaciones] = useState<Validacion[]>([]);
  const [bloqueo, setBloqueo] = useState("");
  const repo = useRef<Repositorio>(repositorioLocal);
  const ultimo = useRef(estado);
  const sucio = useRef(false);
  ultimo.current = estado;

  useEffect(() => {
    let vivo = true;
    (async () => {
      const ses = await abrirSesion();
      if (!ses) return router.replace("/acceso");
      const r = ses.repo;
      repo.current = r;
      setRol(ses.rol); setLocal(ses.local);
      datos().listarRecordatorios().then((g) => vivo && setGenerales(g)).catch(() => {});
      datos().listarNovedades().then((n) => vivo && setNovedades(n)).catch(() => {});
      datos().listarValidaciones().then((v) => vivo && setValidaciones(v)).catch(() => {});
      datos().miPlan().then((p) => vivo && setPlan(calcularPlan(p.estado, p.pruebaHasta))).catch(() => {});
      try {
        const e = await r.cargar();
        if (vivo) { setEstado(e); setListo(true); }
      } catch {
        if (vivo) { setGuardado("error"); setListo(true); }
      }
    })();
    return () => { vivo = false; };
  }, [router]);

  const motivoLectura = plan.soloLectura
    ? "Su periodo de prueba terminó. Puede ver y descargar todo; para modificar, active el plan."
    : rol === "lector" ? "Su rol es de lectura: puede consultar y descargar." : null;
  const permitido = useCallback((a: Accion) => !plan.soloLectura && puede(rol, a), [plan.soloLectura, rol]);

  const actualizar = useCallback((f: (s: EstadoRit) => EstadoRit, accion: Accion = "editar") => {
    if (!permitido(accion)) {
      setBloqueo(plan.soloLectura ? "Plan vencido: puede ver y descargar, pero no modificar." : "Su rol no permite esta acción.");
      return;
    }
    setBloqueo("");
    sucio.current = true;
    setEstado((s) => f(s));
  }, [permitido, plan.soloLectura]);

  const cambiarRolDemo = useCallback((r: Rol) => { fijarRolDemo(r); setRol(r); setBloqueo(""); }, []);
  const refrescarPlan = useCallback(async () => {
    const p = await datos().miPlan();
    setPlan(calcularPlan(p.estado, p.pruebaHasta));
    setBloqueo("");
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

  // Al desmontar el proveedor (p. ej. la versión de un solo archivo remonta al cambiar de pantalla) se guarda lo pendiente.
  useEffect(() => () => { if (sucio.current && repo.current) void repo.current.guardar(ultimo.current).catch(() => {}); }, []);

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
    () => ({
      estado, actualizar, listo, guardado, avisos, urgentes: contarUrgentes(avisos),
      rol, local, cambiarRolDemo, plan, refrescarPlan, novedades, validaciones, permitido, motivoLectura, bloqueo,
    }),
    [estado, actualizar, listo, guardado, avisos, rol, local, cambiarRolDemo, plan, refrescarPlan, novedades, validaciones, permitido, motivoLectura, bloqueo],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
