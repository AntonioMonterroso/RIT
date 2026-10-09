import type { Metadata } from "next";
import RitEditor from "@/components/editor/RitEditor";

export const metadata: Metadata = { title: "Constructor del RIT" };

export default function Page() {
  return <RitEditor />;
}
