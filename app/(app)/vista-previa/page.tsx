import type { Metadata } from "next";
import VistaPrevia from "@/components/vistas/VistaPrevia";

export const metadata: Metadata = { title: "Vista previa" };

export default function Page() {
  return <VistaPrevia />;
}
