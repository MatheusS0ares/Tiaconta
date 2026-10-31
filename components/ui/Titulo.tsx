import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

/** Título da tela com "voltar" no canto superior esquerdo (UX.md, Jakob). */
export function Titulo({ children, voltar, subtitulo }: { children: ReactNode; voltar?: string; subtitulo?: ReactNode }) {
  return (
    <div className="flex items-start gap-1">
      {voltar ? (
        <Link href={voltar} aria-label="Voltar" className="-ml-3 flex size-12 shrink-0 items-center justify-center rounded-full">
          <ChevronLeft className="size-7" aria-hidden />
        </Link>
      ) : null}
      <div className={voltar ? "pt-2" : ""}>
        <h1 className="text-2xl font-semibold leading-tight">{children}</h1>
        {subtitulo ? <p className="mt-1 text-texto-2">{subtitulo}</p> : null}
      </div>
    </div>
  );
}
