import { CircleCheck, Clock, PencilLine, UserX } from "lucide-react";
import type { StatusCrianca as Status } from "@/lib/agenda/modelo";

/** Status sempre com ícone + texto (cor nunca é o único indicador). */
const INFO: Record<Status, { rotulo: string; classe: string; Icone: typeof Clock }> = {
  pendente: { rotulo: "Pendente", classe: "text-atencao", Icone: Clock },
  andamento: { rotulo: "Em andamento", classe: "text-texto-2", Icone: PencilLine },
  finalizado: { rotulo: "Finalizado", classe: "text-sucesso", Icone: CircleCheck },
  faltou: { rotulo: "Faltou", classe: "text-texto-2", Icone: UserX },
};

export function StatusCrianca({ status, detalhe }: { status: Status; detalhe?: string }) {
  const { rotulo, classe, Icone } = INFO[status];
  return (
    <span className={`flex items-center gap-1 text-sm font-semibold ${classe}`}>
      <Icone className="size-4 shrink-0" aria-hidden />
      {rotulo}
      {detalhe ? <span className="font-normal text-texto-2"> · {detalhe}</span> : null}
    </span>
  );
}
