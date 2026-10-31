import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

export type LinkLista = { href: string; rotulo: string; descricao?: string; icone?: LucideIcon };

export function ListaLinks({ itens }: { itens: LinkLista[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {itens.map(({ href, rotulo, descricao, icone: Icone }) => (
        <li key={href}>
          <Link href={href} className="flex min-h-16 items-center gap-4 rounded-tc border border-neutra bg-fundo px-4 py-2">
            {Icone ? <Icone className="size-6 shrink-0" aria-hidden /> : null}
            <span className="flex-1">
              <span className="block font-bold">{rotulo}</span>
              {descricao ? <span className="block text-sm text-texto-2">{descricao}</span> : null}
            </span>
            <ChevronRight className="size-5 shrink-0 text-texto-2" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
