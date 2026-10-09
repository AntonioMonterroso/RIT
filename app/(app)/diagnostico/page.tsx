import type { Metadata } from "next";
import Diagnostico from "@/components/vistas/Diagnostico";

export const metadata: Metadata = { title: "Diagnóstico" };

export default function Page() {
  return <Diagnostico />;
}
