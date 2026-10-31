import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EstadoVazio({ icone: Icone, titulo, children }: { icone: LucideIcon; titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-tc bg-superficie px-6 py-10 text-center">
      <Icone className="size-10 text-texto-2" aria-hidden />
      <p className="font-marca text-lg font-semibold">{titulo}</p>
      {children ? <div className="flex w-full flex-col gap-3 text-texto-2">{children}</div> : null}
    </div>
  );
}
