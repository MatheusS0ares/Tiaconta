import type { Metadata } from "next";
import { Plus, School } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { ListaLinks } from "@/components/ui/ListaLinks";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { BotaoLink } from "@/components/ui/Botao";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { NOME_FAIXA } from "@/lib/agenda/tipos";
import { professorasDaEscola } from "@/lib/gestao";

export const metadata: Metadata = { title: "Turmas" };

export default async function Turmas({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await clienteDaEscola();
  const [{ data: turmas, error }, professoras] = await Promise.all([
    supabase
      .from("turmas")
      .select("id, nome, faixa, ativa, criancas(id, ativa), turma_professoras(user_id)")
      .eq("escola_id", escola.id)
      .order("nome"),
    professorasDaEscola(supabase, escola.id),
  ]);
  if (error) throw error;
  const nomes = new Map(professoras.map((p) => [p.id, p.nome.split(" ")[0]]));

  const descricao = (t: (typeof turmas)[number]) => {
    const n = t.criancas.filter((c) => c.ativa).length;
    const profs = t.turma_professoras.map((p) => nomes.get(p.user_id)).filter(Boolean);
    return [NOME_FAIXA[t.faixa], `${n} ${n === 1 ? "criança" : "crianças"}`, profs.length ? profs.join(", ") : "sem professora"].join(" · ");
  };
  const ativas = turmas.filter((t) => t.ativa);
  const arquivadas = turmas.filter((t) => !t.ativa);

  return (
    <>
      <Titulo>Turmas</Titulo>
      {ativas.length === 0 ? (
        <EstadoVazio icone={School} titulo="Nenhuma turma ainda">
          <p>Toque em &quot;Nova turma&quot; para começar.</p>
        </EstadoVazio>
      ) : (
        <ListaLinks itens={ativas.map((t) => ({ href: `/${slug}/gestao/turmas/${t.id}`, rotulo: t.nome, descricao: descricao(t) }))} />
      )}
      {arquivadas.length ? (
        <details className="rounded-tc border border-neutra">
          <summary className="flex min-h-12 cursor-pointer items-center px-4 font-bold">Arquivadas ({arquivadas.length})</summary>
          <div className="p-2">
            <ListaLinks itens={arquivadas.map((t) => ({ href: `/${slug}/gestao/turmas/${t.id}`, rotulo: t.nome, descricao: NOME_FAIXA[t.faixa] }))} />
          </div>
        </details>
      ) : null}
      <div className="sticky bottom-20 mt-auto pt-2">
        <BotaoLink href={`/${slug}/gestao/turmas/nova`}>
          <Plus className="size-5" aria-hidden />
          Nova turma
        </BotaoLink>
      </div>
    </>
  );
}
