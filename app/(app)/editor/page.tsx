import type { Metadata } from "next";
import Redaccion from "@/components/editor/Redaccion";

export const metadata: Metadata = { title: "Redacción" };

export default function Page() {
  return <Redaccion />;
}
