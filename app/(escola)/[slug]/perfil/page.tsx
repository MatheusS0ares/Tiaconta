import type { Metadata } from "next";
import { SetaLink } from "@/components/ui/SetaLink";
import Link from "next/link";
import { ArrowLeftRight, School } from "lucide-react";
import { AreaPapel } from "@/components/ui/AreaPapel";
import { Cartao } from "@/components/ui/Cartao";
import { BotaoSair } from "@/components/ui/BotaoSair";
import { Titulo } from "@/components/ui/Titulo";
import { escolaAtual } from "@/lib/escola";
import { meuPerfil, minhasEscolas, obterUsuario } from "@/lib/auth/sessao";
import { NOME_DO_PAPEL, ORDEM_PAPEIS, papelPrincipal, ROTA_DO_PAPEL, type Papel } from "@/lib/auth/papeis";
import { itensGestao, itensProfessora, itensResponsavel } from "@/lib/navegacao-papeis";

export const metadata: Metadata = { title: "Perfil" };

const ITENS = { gestor: itensGestao, professora: itensProfessora, responsavel: itensResponsavel } as const;

export default async function Perfil({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ papel?: string }>;
}) {
  const { slug } = await params;
  const { papel: papelBruto } = await searchParams;
  const escola = await escolaAtual(slug);
  const [usuario, perfil, escolas] = await Promise.all([obterUsuario(), meuPerfil(), minhasEscolas()]);

  const papelAtual: Papel = escola.papeis.includes(papelBruto as Papel)
    ? (papelBruto as Papel)
    : papelPrincipal(escola.papeis)!;
  const outrosPapeis = ORDEM_PAPEIS.filter((p) => p !== papelAtual && escola.papeis.includes(p));

  return (
    <AreaPapel itens={ITENS[papelAtual](slug)}>
      <Titulo>Perfil</Titulo>
      <Cartao>
        <p className="font-marca text-xl font-semibold">{perfil?.nome}</p>
        <p className="break-all text-texto-2">{usuario?.email}</p>
        <p className="mt-2 text-sm text-texto-2">
          {escola.nome} · {NOME_DO_PAPEL[papelAtual]}
        </p>
      </Cartao>

      {outrosPapeis.length > 0 || escolas.length > 1 ? (
        <ul className="flex flex-col gap-3">
          {outrosPapeis.map((p) => (
            <li key={p}>
              <Link
                href={`/${slug}/${ROTA_DO_PAPEL[p]}`}
                className="flex min-h-14 items-center gap-3 rounded-tc border border-neutra px-4 font-bold"
              >
                <ArrowLeftRight className="size-5" aria-hidden />
                <span className="flex-1">Ir para {NOME_DO_PAPEL[p]}</span>
                <SetaLink className="size-5 text-texto-2" />
              </Link>
            </li>
          ))}
          {escolas.length > 1 ? (
            <li>
              <Link
                href="/escolher-escola"
                className="flex min-h-14 items-center gap-3 rounded-tc border border-neutra px-4 font-bold"
              >
                <School className="size-5" aria-hidden />
                <span className="flex-1">Trocar de escola</span>
                <SetaLink className="size-5 text-texto-2" />
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className="mt-auto pt-6">
        <BotaoSair />
      </div>
    </AreaPapel>
  );
}
