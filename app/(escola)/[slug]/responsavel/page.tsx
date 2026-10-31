import { Baby } from "lucide-react";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { Cartao } from "@/components/ui/Cartao";
import { Titulo } from "@/components/ui/Titulo";
import { escolaAtual, clienteDaEscola } from "@/lib/escola";

// Etapa 2: lista os filhos. O resumo do dia vem na Etapa 5.
export default async function InicioResponsavel({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const escola = await escolaAtual(slug);
  const supabase = await clienteDaEscola();
  // RLS: o responsável só enxerga os próprios filhos.
  const { data: filhos, error } = await supabase
    .from("criancas")
    .select("id, nome, turmas(nome)")
    .eq("escola_id", escola.id)
    .eq("ativa", true)
    .order("nome");
  if (error) throw error;

  return (
    <>
      <Titulo>Olá!</Titulo>
      {!filhos?.length ? (
        <EstadoVazio icone={Baby} titulo="Nenhuma criança vinculada">
          <p>Peça para a escola enviar o convite com o nome do seu filho.</p>
        </EstadoVazio>
      ) : (
        <ul className="flex flex-col gap-3">
          {filhos.map((c) => (
            <li key={c.id}>
              <Cartao className="min-h-16">
                <p className="font-bold">{c.nome}</p>
                {c.turmas ? <p className="text-texto-2">{c.turmas.nome}</p> : null}
              </Cartao>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
