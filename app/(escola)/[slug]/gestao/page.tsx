import { UserPlus } from "lucide-react";
import { BotaoLink } from "@/components/ui/Botao";
import { Cartao } from "@/components/ui/Cartao";
import { Titulo } from "@/components/ui/Titulo";
import { escolaAtual, clienteDaEscola } from "@/lib/escola";

// Etapa 2: números básicos + atalho para convidar. O painel do dia vem na Etapa 6.
export default async function InicioGestao({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const escola = await escolaAtual(slug);
  const supabase = await clienteDaEscola();
  const contar = (tabela: "turmas" | "criancas") =>
    supabase.from(tabela).select("id", { count: "exact", head: true }).eq("escola_id", escola.id).eq("ativa", true);
  const [turmas, criancas, equipe] = await Promise.all([
    contar("turmas"),
    contar("criancas"),
    supabase
      .from("membros")
      .select("id", { count: "exact", head: true })
      .eq("escola_id", escola.id)
      .eq("ativo", true)
      .eq("papel", "professora"),
  ]);

  const numeros = [
    { rotulo: "Turmas", valor: turmas.count ?? 0 },
    { rotulo: "Crianças", valor: criancas.count ?? 0 },
    { rotulo: "Professoras", valor: equipe.count ?? 0 },
  ];

  return (
    <>
      <Titulo>Gestão</Titulo>
      <ul className="grid grid-cols-3 gap-3">
        {numeros.map((n) => (
          <li key={n.rotulo}>
            <Cartao className="text-center">
              <p className="font-marca text-3xl font-semibold">{n.valor}</p>
              <p className="text-sm text-texto-2">{n.rotulo}</p>
            </Cartao>
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <BotaoLink href={`/${slug}/gestao/equipe/convidar`}>
          <UserPlus className="size-5" aria-hidden />
          Convidar professora ou responsável
        </BotaoLink>
      </div>
    </>
  );
}
