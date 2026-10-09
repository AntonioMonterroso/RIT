"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { saveAs } from "file-saver";
import { generarDocxBlob } from "@/lib/docx";
import { clienteSupabase, supabaseConfigurado } from "@/lib/supabase/cliente";
import { pasos, avanceGeneral } from "@/lib/progreso";
import { pendientesTotales } from "@/lib/revision";
import { AJUSTES, INICIO, PROCESO, RECURSOS, type Destino } from "@/lib/navegacion";
import { useRit } from "./EstadoProvider";
import { Icono } from "./Iconos";
import Paleta, { type Accion } from "./Paleta";
import { Boton, Insignia } from "./ui";

export default function Shell({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  const router = useRouter();
  const { estado, guardado, urgentes, listo } = useRit();
  const [abierto, setAbierto] = useState(false);
  const [paleta, setPaleta] = useState(false);
  // En el editor la barra lateral se reduce a íconos para dar espacio a la hoja.
  const compacto = ruta === "/editor";
  const avance = avanceGeneral(pasos(estado));
  const nombre = estado.empresa.nombre_comercial || estado.empresa.razon_social || "Mi empresa";

  const descargar = async () => {
    const pend = pendientesTotales(estado.capitulos);
    if (pend > 0 && !window.confirm(`Hay ${pend} dato(s) marcados como [COMPLETAR] en el reglamento. ¿Descargar de todos modos?`)) return;
    saveAs(await generarDocxBlob({ empresa: estado.empresa, capitulos: estado.capitulos }), `RIT_${nombre.replace(/\s+/g, "_")}.docx`);
  };
  const salir = async () => { await clienteSupabase()?.auth.signOut(); router.replace("/acceso"); };

  useEffect(() => {
    const f = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaleta((p) => !p); } };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);

  const acciones = useMemo<Accion[]>(() => [
    { id: "a-descargar", texto: "Descargar el RIT (.docx)", icono: "formatos", ejecutar: () => void descargar(), claves: "exportar word" },
    { id: "a-generar", texto: "Generar borrador personalizado", icono: "diagnostico", ejecutar: () => router.push("/diagnostico"), claves: "crear reglamento" },
    { id: "a-recordatorio", texto: "Nuevo recordatorio", icono: "calendario", ejecutar: () => router.push("/calendario"), claves: "agregar aviso" },
    { id: "a-respaldo", texto: "Descargar respaldo", icono: "ajustes", ejecutar: () => router.push("/ajustes"), claves: "copia seguridad" },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [router, estado]);

  const enlace = (d: Destino) => {
    const activo = ruta === d.href;
    return (
      <li key={d.href}>
        <Link href={d.href} title={d.texto} onClick={() => setAbierto(false)} aria-current={activo ? "page" : undefined}
          className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${compacto ? "md:justify-center md:px-0" : ""} ${activo ? "bg-brand-50 text-brand-800 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.30),0_0_18px_-6px_rgba(34,211,238,0.6)]" : "text-ink/80 hover:bg-white/[0.06] hover:text-ink"}`}>
          {activo && <span aria-hidden className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-brand-600 shadow-[0_0_10px_#22d3ee]" />}
          <span className={`relative ${activo ? "text-brand-600" : "text-muted group-hover:text-brand-600"}`}>
            <Icono nombre={d.icono} />
            {compacto && d.href === "/calendario" && urgentes > 0 && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-warn" />}
          </span>
          <span className={`flex-1 ${compacto ? "md:sr-only" : ""}`}>{d.texto}</span>
          {d.href === "/calendario" && urgentes > 0 && <span className={compacto ? "md:hidden" : ""}><Insignia tono="warn">{urgentes}</Insignia></span>}
        </Link>
      </li>
    );
  };
  const grupo = (titulo: string, items: Destino[]) => (
    <div className="mt-5">
      <p className={`etiqueta-mono px-3 pb-1.5 text-[10px] text-muted/80 ${compacto ? "md:hidden" : ""}`}>{titulo}</p>
      <ul className="space-y-0.5">{items.map(enlace)}</ul>
    </div>
  );

  return (
    <div className="flex min-h-screen gap-3 p-3">
      <aside className={`no-imprimir vidrio-fuerte fixed inset-y-3 left-3 z-30 flex w-64 flex-col rounded-2xl px-3 py-4 shadow-pop transition-transform md:sticky md:top-3 md:h-[calc(100vh-1.5rem)] md:translate-x-0 ${compacto ? "md:w-[68px] md:px-2" : ""} ${abierto ? "translate-x-0" : "-translate-x-[120%] max-md:invisible"}`}>
        <Link href="/inicio" onClick={() => setAbierto(false)} aria-label="RIT Guatemala, ir al inicio" className={`flex items-center gap-3 px-2 pb-1 ${compacto ? "md:justify-center md:px-0" : ""}`}>
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl degradado-boton text-sm font-black shadow-[0_0_20px_-2px_rgba(34,211,238,0.8)]">R</span>
          <span className={compacto ? "md:hidden" : ""}><span className="block text-sm font-semibold leading-tight tracking-tight">RIT Guatemala</span><span className="etiqueta-mono block text-[9px] text-muted">Reglamento · IGT</span></span>
        </Link>
        <nav aria-label="Principal" className="mt-3 flex-1 overflow-y-auto pb-3">
          <ul>{enlace(INICIO)}</ul>
          {grupo("Proceso", PROCESO)}
          {grupo("Recursos", RECURSOS)}
          <ul className="mt-5">{enlace(AJUSTES)}</ul>
        </nav>
        <div className={`rounded-xl border border-line bg-black/25 p-3 ${compacto ? "md:hidden" : ""}`}>
          <div className="flex items-baseline justify-between"><span className="etiqueta-mono text-[10px] text-muted">Avance</span><span className="etiqueta-mono text-sm font-bold text-brand-700">{listo ? `${avance}%` : "…"}</span></div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] shadow-[0_0_8px_#22d3ee]" style={{ width: `${avance}%` }} /></div>
        </div>
      </aside>
      {abierto && <button aria-label="Cerrar menú" onClick={() => setAbierto(false)} className="no-imprimir fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden" />}

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <header className="no-imprimir vidrio-fuerte sticky top-3 z-10 flex h-14 items-center gap-3 rounded-2xl px-3 md:px-4">
          <button onClick={() => setAbierto(true)} aria-label="Abrir menú" className="grid h-9 w-9 place-items-center rounded-xl border border-line md:hidden">☰</button>
          <p className="min-w-0 truncate text-sm font-semibold tracking-tight md:max-w-56">{nombre}</p>
          <button onClick={() => setPaleta(true)} aria-label="Abrir buscador de comandos"
            className="group mx-auto hidden h-9 w-full max-w-md items-center gap-2.5 rounded-xl border border-line bg-black/30 px-3 text-sm text-muted transition-colors hover:border-brand-600/50 hover:text-ink sm:flex">
            <Icono nombre="diagnostico" className="h-4 w-4 text-brand-600" />
            <span className="flex-1 text-left">Buscar o ir a…</span>
            <kbd className="etiqueta-mono rounded border border-line px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
          </button>
          <span className="ml-auto flex items-center gap-2 text-xs text-muted sm:ml-0" role="status" aria-live="polite">
            {guardado === "guardando" && <><span className="pulso h-1.5 w-1.5 rounded-full bg-brand-600" />Guardando…</>}
            {guardado === "ok" && <><span className="h-1.5 w-1.5 rounded-full bg-ok" />Guardado</>}
            {guardado === "error" && <><span className="h-1.5 w-1.5 rounded-full bg-danger" />No se pudo guardar</>}
          </span>
          <button onClick={() => setPaleta(true)} aria-label="Buscar" className="grid h-9 w-9 place-items-center rounded-xl border border-line text-brand-600 sm:hidden"><Icono nombre="diagnostico" className="h-4 w-4" /></button>
          <Boton pequeno onClick={() => void descargar()}>Descargar RIT (.docx)</Boton>
          {supabaseConfigurado && <Boton variante="fantasma" pequeno onClick={salir}>Salir</Boton>}
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <Paleta abierta={paleta} onCerrar={() => setPaleta(false)} acciones={acciones} />
    </div>
  );
}
