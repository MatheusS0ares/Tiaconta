"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Baby, House, School, UserRound, Users, type LucideIcon } from "lucide-react";

const ICONES = { inicio: House, turma: School, criancas: Baby, equipe: Users, perfil: UserRound } satisfies Record<
  string,
  LucideIcon
>;

export type ItemBarra = { href: string; rotulo: string; icone: keyof typeof ICONES; exato?: boolean };

/** Navegação inferior (UX.md, Jakob): no máximo 4 itens, alvo ≥ 48px. */
export function BarraInferior({ itens }: { itens: ItemBarra[] }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-neutra bg-fundo pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-xl">
        {itens.slice(0, 4).map((item) => {
          const caminho = item.href.split("?")[0]!;
          const ativo = item.exato ? pathname === caminho : pathname === caminho || pathname.startsWith(caminho + "/");
          const Icone = ICONES[item.icone];
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
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
  );
}
