import type { Metadata } from "next";
import Formatos from "@/components/vistas/Formatos";

export const metadata: Metadata = { title: "Formatos" };

export default function Page() {
  return <Formatos />;
}
