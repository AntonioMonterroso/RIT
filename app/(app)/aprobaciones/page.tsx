import type { Metadata } from "next";
import Aprobaciones from "@/components/vistas/Aprobaciones";

export const metadata: Metadata = { title: "Aprobaciones" };

export default function Page() {
  return <Aprobaciones />;
}
