import type { Metadata } from "next";
import { School } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { BotaoLink } from "@/components/ui/Botao";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { FormCrianca } from "../FormCrianca";

export const metadata: Metadata = { title: "Nova criança" };

export default async function NovaCrianca({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ turma?: string }>;
}) {
  const { slug } = await params;
  const { turma } = await searchParams;
  const escola = await exigirPapel(slug, "gestor");
  const { data: turmas } = await (await clienteDaEscola())
    .from("turmas")
    .select("id, nome")
    .eq("escola_id", escola.id)
    .eq("ativa", true)
    .order("nome");

  return (
    <>
      <Titulo voltar={`/${slug}/gestao/criancas`}>Nova criança</Titulo>
      {turmas?.length ? (
        <FormCrianca slug={slug} turmas={turmas} turmaPadrao={turma ?? (turmas.length === 1 ? turmas[0]!.id : undefined)} />
      ) : (
        <>
          <EstadoVazio icone={School} titulo="Crie uma turma primeiro">
            <p>Toda criança precisa estar em uma turma.</p>
          </EstadoVazio>
          <BotaoLink href={`/${slug}/gestao/turmas/nova`}>Criar turma</BotaoLink>
        </>
      )}
    </>
  );
}
