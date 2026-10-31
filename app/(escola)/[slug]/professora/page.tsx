import { redirect } from "next/navigation";
import { School } from "lucide-react";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { ListaLinks } from "@/components/ui/ListaLinks";
import { Titulo } from "@/components/ui/Titulo";
import { escolaAtual, clienteDaEscola } from "@/lib/escola";
import { obterUsuario } from "@/lib/auth/sessao";

export default async function InicioProfessora({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const escola = await escolaAtual(slug);
  const usuario = (await obterUsuario())!;
  const supabase = await clienteDaEscola();
  const { data, error } = await supabase
    .from("turma_professoras")
    .select("turmas!inner(id, nome, ativa)")
    .eq("escola_id", escola.id)
    .eq("user_id", usuario.id)
    .eq("turmas.ativa", true);
  if (error) throw error;
  const turmas = data.map((t) => t.turmas).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  // Uma turma só: vai direto (menos um toque).
  if (turmas.length === 1) redirect(`/${slug}/professora/turma/${turmas[0]!.id}`);

  return (
    <>
      <Titulo>Suas turmas</Titulo>
      {turmas.length === 0 ? (
        <EstadoVazio icone={School} titulo="Nenhuma turma ainda">
          <p>Peça para a gestão da escola vincular você a uma turma.</p>
        </EstadoVazio>
      ) : (
        <ListaLinks itens={turmas.map((t) => ({ href: `/${slug}/professora/turma/${t.id}`, rotulo: t.nome }))} />
      )}
    </>
  );
}
