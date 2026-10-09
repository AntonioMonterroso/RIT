import type { Metadata } from "next";
import Calendario from "@/components/Calendario";

export const metadata: Metadata = { title: "Calendario" };

export default function Page() {
  return <Calendario />;
}
