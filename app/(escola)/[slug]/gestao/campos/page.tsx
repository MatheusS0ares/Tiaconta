import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { NOME_FAIXA, NOME_TIPO, opcoesDoCampo } from "@/lib/agenda/tipos";
import { ListaCampos } from "./ListaCampos";
import { criarCamposPadrao } from "./actions";

export const metadata: Metadata = { title: "Campos da agenda" };

export default async function Campos({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const escola = await exigirPapel(slug, "gestor");
  const { data: campos, error } = await (await clienteDaEscola())
    .from("agenda_campos")
    .select("id, rotulo, tipo, opcoes, faixas, ativo, visivel_responsavel")
    .eq("escola_id", escola.id)
    .order("ordem")
    .order("rotulo");
  if (error) throw error;

  const lista = campos.map((c) => {
    const opcoes = opcoesDoCampo(c.opcoes);
    const partes = [
      opcoes.length ? opcoes.slice(0, 3).join(", ") + (opcoes.length > 3 ? "…" : "") : NOME_TIPO[c.tipo],
      c.faixas?.length ? c.faixas.map((f) => NOME_FAIXA[f]).join(", ") : null,
      c.visivel_responsavel ? null : "só equipe",
    ].filter(Boolean);
    return { id: c.id, rotulo: c.rotulo, ativo: c.ativo, descricao: partes.join(" · ") };
  });

  return (
    <>
      <Titulo voltar={`/${slug}/gestao/mais`} subtitulo="O que a professora registra no dia. Toque para editar.">
        Campos da agenda
      </Titulo>
      {lista.length === 0 ? (
        <>
          <EstadoVazio icone={ListChecks} titulo="Nenhum campo ainda">
            <p>Comece com o modelo padrão (alimentação, sono, fralda, recados…) e ajuste depois.</p>
          </EstadoVazio>
          <form action={criarCamposPadrao.bind(null, slug)} className="mt-auto">
            <BotaoEnviar textoEnviando="Criando…">Usar modelo padrão</BotaoEnviar>
          </form>
        </>
      ) : (
        <ListaCampos slug={slug} campos={lista} />
      )}
    </>
  );
}
