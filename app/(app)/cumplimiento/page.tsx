import type { Metadata } from "next";
import Cumplimiento from "@/components/vistas/Cumplimiento";

export const metadata: Metadata = { title: "Rutina y bitácora" };

export default function Page() {
  return <Cumplimiento />;
}
