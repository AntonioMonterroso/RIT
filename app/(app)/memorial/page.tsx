import type { Metadata } from "next";
import Memorial from "@/components/vistas/Memorial";

export const metadata: Metadata = { title: "Memorial" };

export default function Page() {
  return <Memorial />;
}
