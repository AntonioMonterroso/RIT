import { useMemo, useSyncExternalStore } from "react";

/** Sustituto de next/navigation para la demostración: enrutamiento por hash (#/inicio). */
const suscribir = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export const rutaActual = (): string => {
  const h = window.location.hash.replace(/^#/, "");
  const i = h.indexOf("?");
  return (i >= 0 ? h.slice(0, i) : h) || "/";
};

export const usePathname = () => useSyncExternalStore(suscribir, rutaActual, () => "/");

export const useRouter = () =>
  useMemo(() => ({
    push: (href: string) => { window.location.hash = href; },
    replace: (href: string) => { window.location.replace(`#${href}`); },
    back: () => window.history.back(),
    refresh: () => {},
  }), []);
