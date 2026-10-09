"use client";

import { useId } from "react";

/* Componentes base del sistema de diseño. Documentados en docs/DESIGN_SYSTEM.md. */

export type Tono = "neutro" | "marca" | "ok" | "warn" | "danger" | "info";

const TONO: Record<Tono, string> = {
  neutro: "bg-white/5 text-muted border-line",
  marca: "bg-brand-50 text-brand-700 border-brand-600/40",
  ok: "bg-ok-bg text-ok border-ok-line",
  warn: "bg-warn-bg text-warn border-warn-line",
  danger: "bg-danger-bg text-danger border-danger-line",
  info: "bg-info-bg text-info border-info-line",
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/* ───────── Botón ───────── */
type Variante = "primario" | "secundario" | "fantasma" | "peligro";
const VARIANTE: Record<Variante, string> = {
  primario: "degradado-boton border-transparent shadow-[0_0_22px_-6px_rgba(34,211,238,0.7)] hover:brightness-110 hover:shadow-[0_0_30px_-4px_rgba(34,211,238,0.85)]",
  secundario: "vidrio text-brand-700 hover:border-brand-600/60 hover:bg-brand-50",
  fantasma: "bg-transparent text-ink border-transparent hover:bg-white/8",
  peligro: "bg-transparent text-danger border-danger-line hover:bg-danger-bg",
};

export function Boton({ variante = "primario", pequeno, className, ...p }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; pequeno?: boolean }) {
  return (
    <button
      type="button"
      {...p}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl border font-semibold tracking-tight transition-all disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
        pequeno ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        VARIANTE[variante], className,
      )}
    />
  );
}

/* ───────── Tarjeta ───────── */
export function Tarjeta({ titulo, descripcion, acciones, children, className, relleno = true }: {
  titulo?: string; descripcion?: string; acciones?: React.ReactNode; children?: React.ReactNode; className?: string; relleno?: boolean;
}) {
  return (
    <section className={cx("vidrio aparece rounded-[var(--radius)]", className)}>
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-6 py-4">
          <div>
            {titulo && <h2 className="text-[15px] font-semibold tracking-tight text-ink">{titulo}</h2>}
            {descripcion && <p className="mt-0.5 text-sm text-muted">{descripcion}</p>}
          </div>
          {acciones}
        </header>
      )}
      {children && <div className={relleno ? "p-6" : ""}>{children}</div>}
    </section>
  );
}

/* ───────── Insignia ───────── */
export function Insignia({ tono = "neutro", children }: { tono?: Tono; children: React.ReactNode }) {
  return <span className={cx("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", TONO[tono])}>{children}</span>;
}

/* ───────── Aviso (mensaje en línea) ───────── */
export function Aviso({ tono = "info", titulo, children, className }: { tono?: Tono; titulo?: string; children?: React.ReactNode; className?: string }) {
  const rol = tono === "danger" ? "alert" : "status";
  return (
    <div role={rol} className={cx("rounded-xl border px-4 py-3 text-sm backdrop-blur", TONO[tono], className)}>
      {titulo && <p className="font-bold">{titulo}</p>}
      {children && <div className={titulo ? "mt-0.5" : ""}>{children}</div>}
    </div>
  );
}

/* ───────── Barra de progreso ───────── */
export function Progreso({ valor, etiqueta, tono = "marca" }: { valor: number; etiqueta: string; tono?: "marca" | "ok" | "warn" | "danger" }) {
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  const color = {
    marca: "bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] shadow-[0_0_12px_rgba(34,211,238,0.55)]",
    ok: "bg-ok shadow-[0_0_10px_rgba(74,222,128,0.5)]", warn: "bg-warn", danger: "bg-danger",
  }[tono];
  return (
    <div role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className={cx("h-full rounded-full transition-all", color)} style={{ width: `${v}%` }} />
    </div>
  );
}

/* ───────── Campos de formulario ───────── */
const ENTRADA = "mt-1.5 w-full rounded-xl border border-line bg-black/30 px-3.5 py-2.5 text-sm font-normal text-ink placeholder:text-muted/60 transition-colors hover:border-brand-600/40 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30 disabled:opacity-50";

export function Campo({ etiqueta, ayuda, error, ancho, children }: {
  etiqueta: string; ayuda?: string; error?: string; ancho?: boolean;
  children: (p: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean; className: string }) => React.ReactNode;
}) {
  const id = useId();
  const desc = error ? `${id}-e` : ayuda ? `${id}-a` : undefined;
  return (
    <div className={ancho ? "md:col-span-2" : ""}>
      <label htmlFor={id} className="block text-[13px] font-semibold text-ink/90">{etiqueta}</label>
      {children({ id, "aria-describedby": desc, "aria-invalid": error ? true : undefined, className: ENTRADA })}
      {ayuda && !error && <p id={`${id}-a`} className="mt-1 text-xs text-muted">{ayuda}</p>}
      {error && <p id={`${id}-e`} className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

export function Texto({ etiqueta, ayuda, error, ancho, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; ayuda?: string; error?: string; ancho?: boolean }) {
  return <Campo etiqueta={etiqueta} ayuda={ayuda} error={error} ancho={ancho}>{(c) => <input {...p} {...c} />}</Campo>;
}

export function Seleccion({ etiqueta, ayuda, ancho, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { etiqueta: string; ayuda?: string; ancho?: boolean }) {
  return <Campo etiqueta={etiqueta} ayuda={ayuda} ancho={ancho}>{(c) => <select {...p} {...c}>{children}</select>}</Campo>;
}

export function AreaTexto({ etiqueta, ayuda, ancho, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { etiqueta: string; ayuda?: string; ancho?: boolean }) {
  return <Campo etiqueta={etiqueta} ayuda={ayuda} ancho={ancho}>{(c) => <textarea {...p} {...c} />}</Campo>;
}

export function Interruptor({ etiqueta, ayuda, checked, onChange }: { etiqueta: string; ayuda?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <label htmlFor={id} className="vidrio flex cursor-pointer items-start gap-3 rounded-xl p-3.5 transition-colors hover:border-brand-600/50 has-[:checked]:border-brand-600/60 has-[:checked]:bg-brand-50">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand-600)]" />
      <span>
        <span className="block text-sm font-semibold text-ink">{etiqueta}</span>
        {ayuda && <span className="block text-xs text-muted">{ayuda}</span>}
      </span>
    </label>
  );
}

/* ───────── Encabezado de página ───────── */
export function Pagina({ titulo, descripcion, acciones, children, ancho = "max-w-5xl" }: {
  titulo: string; descripcion?: string; acciones?: React.ReactNode; children: React.ReactNode; ancho?: string;
}) {
  return (
    <div className={cx("mx-auto w-full px-5 py-8 md:px-10", ancho)}>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="etiqueta-mono mb-2 text-[11px] text-brand-600">RIT Guatemala</p>
          <h1 className="degradado-texto text-3xl font-semibold tracking-tight md:text-[34px]">{titulo}</h1>
          {descripcion && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{descripcion}</p>}
        </div>
        {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
      </header>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export function Vacio({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-line bg-white/[0.03] px-6 py-10 text-center">
      <p className="font-semibold text-ink">{titulo}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}

/* ───────── Anillo de progreso ───────── */
export function Anillo({ valor, etiqueta, tamano = 168, children }: { valor: number; etiqueta: string; tamano?: number; children?: React.ReactNode }) {
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  const r = 52; const c = 2 * Math.PI * r;
  const id = useId();
  return (
    <div role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} className="relative grid place-items-center" style={{ width: tamano, height: tamano }}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#22d3ee" /><stop offset="55%" stopColor="#818cf8" /><stop offset="100%" stopColor="#f0abfc" /></linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(148,170,220,0.16)" strokeWidth="7" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={`url(#g${id})`} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ transition: "stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)", filter: "drop-shadow(0 0 6px rgba(34,211,238,.6))" }} />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}
