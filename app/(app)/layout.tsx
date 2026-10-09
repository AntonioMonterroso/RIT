import EstadoProvider from "@/components/EstadoProvider";
import Shell from "@/components/Shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <EstadoProvider>
      <Shell>{children}</Shell>
    </EstadoProvider>
  );
}
