import { School } from "lucide-react";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { Cartao } from "@/components/ui/Cartao";
import { Titulo } from "@/components/ui/Titulo";
import { escolaAtual, clienteDaEscola } from "@/lib/escola";
import { obterUsuario } from "@/lib/auth/sessao";

// Etapa 2: lista as turmas da professora. A tela da turma (registro) vem na Etapa 4.
export default async function InicioProfessora({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const escola = await escolaAtual(slug);
  const usuario = (await obterUsuario())!;
  const supabase = await clienteDaEscola();
  const { data: turmas, error } = await supabase
    .from("turma_professoras")
    .select("turmas!inner(id, nome, ativa)")
    .eq("escola_id", escola.id)
    .eq("user_id", usuario.id)
    .eq("turmas.ativa", true);
  if (error) throw error;

  return (
    <>
      <Titulo>Suas turmas</Titulo>
      {!turmas?.length ? (
        <EstadoVazio icone={School} titulo="Nenhuma turma ainda">
          <p>Peça para a gestão da escola vincular você a uma turma.</p>
        </EstadoVazio>
      ) : (
        <ul className="flex flex-col gap-3">
          {turmas.map(({ turmas: t }) => (
            <li key={t.id}>
              <Cartao className="min-h-16 font-bold">{t.nome}</Cartao>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
