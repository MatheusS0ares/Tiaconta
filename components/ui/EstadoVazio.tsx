import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Props = { icone: LucideIcon; titulo: string; children?: ReactNode; /** quando o estado vazio é o conteúdo principal da tela */ principal?: boolean };

export function EstadoVazio({ icone: Icone, titulo, children, principal }: Props) {
  const Tag = principal ? "h1" : "p";
  return (
    <div className="flex flex-col items-center gap-3 rounded-tc bg-superficie px-6 py-10 text-center">
      <Icone className="size-10 text-texto-2" aria-hidden />
      <Tag className="font-marca text-lg font-semibold">{titulo}</Tag>
      {children ? <div className="flex w-full flex-col gap-3 text-texto-2">{children}</div> : null}
    </div>
  );
}
