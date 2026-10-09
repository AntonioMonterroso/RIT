import type { Metadata } from "next";
import Tramite from "@/components/vistas/Tramite";

export const metadata: Metadata = { title: "Trámite IGT" };

export default function Page() {
  return <Tramite />;
}
