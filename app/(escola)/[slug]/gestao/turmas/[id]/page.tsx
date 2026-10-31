import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Titulo } from "@/components/ui/Titulo";
import { ListaLinks } from "@/components/ui/ListaLinks";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { idade, professorasDaEscola } from "@/lib/gestao";
import { FormTurma } from "../FormTurma";
import { FormArquivar } from "../FormArquivar";

export const metadata: Metadata = { title: "Turma" };

export default async function EditarTurma({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await clienteDaEscola();
  const [{ data: turma }, professoras] = await Promise.all([
    supabase
      .from("turmas")
      .select("id, nome, faixa, ativa, turma_professoras(user_id), criancas(id, nome, data_nascimento, ativa)")
      .eq("id", id)
      .eq("escola_id", escola.id)
      .maybeSingle(),
    professorasDaEscola(supabase, escola.id),
  ]);
  if (!turma) notFound();
  const criancas = turma.criancas.filter((c) => c.ativa).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <>
      <Titulo voltar={`/${slug}/gestao/turmas`} subtitulo={turma.ativa ? undefined : "Arquivada"}>
        {turma.nome}
      </Titulo>
      <FormTurma
        slug={slug}
        professoras={professoras}
        turma={{ id: turma.id, nome: turma.nome, faixa: turma.faixa, professoras: turma.turma_professoras.map((p) => p.user_id) }}
      />
      <section className="flex flex-col gap-3" aria-labelledby="criancas-turma">
        <h2 id="criancas-turma" className="text-lg font-semibold">
          Crianças ({criancas.length})
        </h2>
        {criancas.length ? (
          <ListaLinks
            itens={criancas.map((c) => ({
              href: `/${slug}/gestao/criancas/${c.id}`,
              rotulo: c.nome,
              descricao: idade(c.data_nascimento) ?? undefined,
            }))}
          />
        ) : (
          <p className="text-texto-2">Nenhuma criança nesta turma. Cadastre em Crianças.</p>
        )}
      </section>
      <section className="border-t border-neutra pt-4">
        <FormArquivar slug={slug} id={turma.id} ativa={turma.ativa} />
      </section>
    </>
  );
}
