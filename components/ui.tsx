"use client";

import { useId } from "react";

/* Componentes base del sistema de diseño. Documentados en docs/DESIGN_SYSTEM.md. */

export type Tono = "neutro" | "marca" | "ok" | "warn" | "danger" | "info";

const TONO: Record<Tono, string> = {
  neutro: "bg-canvas text-muted border-line",
  marca: "bg-brand-50 text-brand-700 border-brand-100",
  ok: "bg-ok-bg text-ok border-ok-line",
  warn: "bg-warn-bg text-warn border-warn-line",
  danger: "bg-danger-bg text-danger border-danger-line",
  info: "bg-info-bg text-info border-info-line",
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/* ───────── Botón ───────── */
type Variante = "primario" | "secundario" | "fantasma" | "peligro";
const VARIANTE: Record<Variante, string> = {
  primario: "bg-brand-700 text-white hover:bg-brand-800 border-transparent",
  secundario: "bg-surface text-brand-700 border-line hover:bg-brand-50 hover:border-brand-100",
  fantasma: "bg-transparent text-ink border-transparent hover:bg-canvas",
  peligro: "bg-surface text-danger border-danger-line hover:bg-danger-bg",
};

export function Boton({ variante = "primario", pequeno, className, ...p }:
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; pequeno?: boolean }) {
  return (
    <button
      type="button"
      {...p}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
    <section className={cx("rounded-[var(--radius)] border border-line bg-surface shadow-card", className)}>
      {(titulo || acciones) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {titulo && <h2 className="text-[15px] font-bold text-ink">{titulo}</h2>}
            {descripcion && <p className="mt-0.5 text-sm text-muted">{descripcion}</p>}
          </div>
          {acciones}
        </header>
      )}
      {children && <div className={relleno ? "p-5" : ""}>{children}</div>}
    </section>
  );
}

/* ───────── Insignia ───────── */
export function Insignia({ tono = "neutro", children }: { tono?: Tono; children: React.ReactNode }) {
  return <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold", TONO[tono])}>{children}</span>;
}

/* ───────── Aviso (mensaje en línea) ───────── */
export function Aviso({ tono = "info", titulo, children, className }: { tono?: Tono; titulo?: string; children?: React.ReactNode; className?: string }) {
  const rol = tono === "danger" ? "alert" : "status";
  return (
    <div role={rol} className={cx("rounded-lg border px-4 py-3 text-sm", TONO[tono], className)}>
      {titulo && <p className="font-bold">{titulo}</p>}
      {children && <div className={titulo ? "mt-0.5" : ""}>{children}</div>}
    </div>
  );
}

/* ───────── Barra de progreso ───────── */
export function Progreso({ valor, etiqueta, tono = "marca" }: { valor: number; etiqueta: string; tono?: "marca" | "ok" | "warn" | "danger" }) {
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  const color = { marca: "bg-brand-600", ok: "bg-ok", warn: "bg-warn", danger: "bg-danger" }[tono];
  return (
    <div role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} className="h-2 w-full overflow-hidden rounded-full bg-line">
      <div className={cx("h-full rounded-full transition-all", color)} style={{ width: `${v}%` }} />
    </div>
  );
}

/* ───────── Campos de formulario ───────── */
const ENTRADA = "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm font-normal text-ink placeholder:text-muted/70 disabled:bg-canvas";

export function Campo({ etiqueta, ayuda, error, ancho, children }: {
  etiqueta: string; ayuda?: string; error?: string; ancho?: boolean;
  children: (p: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean; className: string }) => React.ReactNode;
}) {
  const id = useId();
  const desc = error ? `${id}-e` : ayuda ? `${id}-a` : undefined;
  return (
    <div className={ancho ? "md:col-span-2" : ""}>
      <label htmlFor={id} className="block text-sm font-semibold text-ink">{etiqueta}</label>
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
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface p-3 hover:bg-canvas">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand-700)]" />
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
    <div className={cx("mx-auto w-full px-5 py-7 md:px-8", ancho)}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{titulo}</h1>
          {descripcion && <p className="mt-1 max-w-2xl text-sm text-muted">{descripcion}</p>}
        </div>
        {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
      </header>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

export function Vacio({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-line bg-surface px-6 py-10 text-center">
      <p className="font-semibold text-ink">{titulo}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}
