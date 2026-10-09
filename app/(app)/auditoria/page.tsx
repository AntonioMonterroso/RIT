import type { Metadata } from "next";
import Auditoria from "@/components/vistas/Auditoria";

export const metadata: Metadata = { title: "Auditoría IGT" };

export default function Page() {
  return <Auditoria />;
}
