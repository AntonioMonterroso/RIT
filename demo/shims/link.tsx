import type { AnchorHTMLAttributes } from "react";

/** Sustituto de next/link para la demostración de un solo archivo: la ruta va en el hash. */
export default function Link({ href, prefetch: _p, children, ...resto }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean }) {
  void _p;
  return <a href={`#${href}`} {...resto}>{children}</a>;
}
