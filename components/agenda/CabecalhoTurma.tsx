"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { formatarDataLonga, hoje } from "@/lib/agenda/data";
import { useAgenda } from "./AgendaProvider";

/** Nome da turma, data de hoje e abas Crianças | Mural. */
export function CabecalhoTurma() {
  const { estado, base, voltar } = useAgenda();
  const pathname = usePathname();
  const abas = [
    { href: base, rotulo: "Crianças" },
    { href: `${base}/mural`, rotulo: "Mural" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-1">
        {voltar ? (
          <Link href={voltar} aria-label="Voltar" className="-ml-3 flex size-12 shrink-0 items-center justify-center rounded-full">
            <ChevronLeft className="size-7" aria-hidden />
          </Link>
        ) : null}
        <div className={voltar ? "pt-1" : ""}>
        <h1 className="text-2xl font-semibold leading-tight">{estado.turma.nome}</h1>
        <p className="text-texto-2 first-letter:uppercase">
          {estado.data === hoje() ? "Hoje · " : ""}
          {formatarDataLonga(estado.data)}
        </p>
        </div>
      </div>
      <nav aria-label="Seções da turma" className="grid grid-cols-2 rounded-tc bg-superficie p-1">
        {abas.map((a) => {
          const ativa = pathname === a.href;
          return (
            <Link
              key={a.href}
              href={a.href}
              aria-current={ativa ? "page" : undefined}
              className={`flex min-h-12 items-center justify-center rounded-tc font-bold ${ativa ? "bg-fundo shadow-sm" : "text-texto-2"}`}
            >
              {a.rotulo}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
