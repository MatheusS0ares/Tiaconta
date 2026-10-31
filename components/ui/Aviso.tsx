import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

type Tipo = "erro" | "sucesso" | "info";

const estilos: Record<Tipo, { classe: string; Icone: typeof Info }> = {
  erro: { classe: "border-alerta text-alerta", Icone: CircleAlert },
  sucesso: { classe: "border-sucesso text-sucesso", Icone: CircleCheck },
  info: { classe: "border-neutra text-texto", Icone: Info },
};

/** Mensagem inline. Cor nunca é o único indicador: sempre ícone + texto. */
export function Aviso({ tipo = "info", children }: { tipo?: Tipo; children: ReactNode }) {
  const { classe, Icone } = estilos[tipo];
  return (
    <div role={tipo === "erro" ? "alert" : "status"} className={`flex items-start gap-3 rounded-tc border-2 bg-fundo p-4 ${classe}`}>
      <Icone className="mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="font-semibold">{children}</div>
    </div>
  );
}
