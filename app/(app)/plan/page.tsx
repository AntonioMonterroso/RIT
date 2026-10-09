import type { Metadata } from "next";
import Plan from "@/components/vistas/Plan";

export const metadata: Metadata = { title: "Plan y suscripción" };

export default function Page() {
  return <Plan />;
}
