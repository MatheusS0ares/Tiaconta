"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Baby, CalendarDays, House, Menu, School, UserRound, Users, type LucideIcon } from "lucide-react";

const ICONES = { inicio: House, turma: School, criancas: Baby, equipe: Users, perfil: UserRound, mais: Menu, calendario: CalendarDays } satisfies Record<
  string,
  LucideIcon
>;

export type ItemBarra = {
  href: string;
  rotulo: string;
  icone: keyof typeof ICONES;
  exato?: boolean;
  /** outros caminhos em que este item aparece ativo (ex.: "Mais") */
  ativoEm?: string[];
};

/** Navegação inferior (UX.md, Jakob): no máximo 4 itens, alvo ≥ 48px. */
export function BarraInferior({ itens }: { itens: ItemBarra[] }) {
  const pathname = usePathname();
  // Resposta imediata ao toque (< 400ms): marca o item tocado antes da página chegar.
  const [tocado, setTocado] = useState<string | null>(null);
  useEffect(() => setTocado(null), [pathname]);

  // Item ativo = o que casa com o caminho mais específico (ex.: /responsavel/calendario
  // ganha de /responsavel; /responsavel/<criança> fica com /responsavel).
  const casa = (c: string, exato?: boolean) => pathname === c || (!exato && pathname.startsWith(c + "/"));
  const ativoAtual = itens
    .flatMap((item) =>
      [item.href.split("?")[0]!, ...(item.ativoEm ?? [])]
        .filter((c, i) => casa(c, i === 0 ? item.exato : false))
        .map((c) => ({ href: item.href, tamanho: c.length })),
    )
    .sort((a, b) => b.tamanho - a.tamanho)[0]?.href;
  return (
    <>
    {/* troca de aba em andamento: barra fina no topo (a tela anterior continua visível) */}
    {tocado ? (
      <div role="progressbar" aria-label="Carregando" className="fixed inset-x-0 top-0 z-40 h-1 overflow-hidden bg-neutra">
        <div className="h-full w-1/3 animate-[carregando_1s_ease-in-out_infinite] bg-primaria" />
      </div>
    ) : null}
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-neutra bg-fundo pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-xl">
        {itens.slice(0, 4).map((item) => {
          const ativo = tocado ? tocado === item.href : item.href === ativoAtual;
          const Icone = ICONES[item.icone];
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                onClick={() => item.href !== ativoAtual && setTocado(item.href)}
                aria-current={ativo ? "page" : undefined}
                className={
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-sm font-bold " +
                  (ativo ? "text-texto" : "text-texto-2")
                }
              >
                <Icone className="size-6" aria-hidden strokeWidth={ativo ? 2.5 : 2} />
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </>
  );
}
