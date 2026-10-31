"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatarDataLonga } from "@/lib/agenda/data";
import { useAgenda } from "./AgendaProvider";

/** Nome da turma, data de hoje e abas Crianças | Mural. */
export function CabecalhoTurma({ slug }: { slug: string }) {
  const { estado } = useAgenda();
  const pathname = usePathname();
  const base = `/${slug}/professora/turma/${estado.turma.id}`;
  const abas = [
    { href: base, rotulo: "Crianças" },
    { href: `${base}/mural`, rotulo: "Mural" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold leading-tight">{estado.turma.nome}</h1>
        <p className="text-texto-2 first-letter:uppercase">Hoje · {formatarDataLonga(estado.data)}</p>
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
