import type { Metadata } from "next";
import { UserCheck } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { ListaLinks } from "@/components/ui/ListaLinks";
import { NavegarData } from "@/components/gestao/NavegarData";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { carregarPainel } from "@/lib/gestao/painel";
import { dataDoPainel } from "@/lib/gestao/data-painel";

export const metadata: Metadata = { title: "Faltas" };

export default async function Faltas({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ data?: string }> }) {
  const { slug } = await params;
  const data = dataDoPainel((await searchParams).data);
  const escola = await exigirPapel(slug, "gestor");
  const p = await carregarPainel(await clienteDaEscola(), escola.id, data);

  return (
    <>
      <Titulo voltar={`/${slug}/gestao?data=${data}`}>Faltas</Titulo>
      <NavegarData data={data} href={(d) => `/${slug}/gestao/faltas?data=${d}`} />
      {p.faltas.length === 0 ? (
        <EstadoVazio icone={UserCheck} titulo="Nenhuma falta registrada">
          <p>Quando a professora marcar uma falta, ela aparece aqui.</p>
        </EstadoVazio>
      ) : (
        <ListaLinks
          itens={p.faltas.map((f) => ({
            href: `/${slug}/gestao/agenda/${f.turmaId}/${data}/crianca/${f.criancaId}`,
            rotulo: f.crianca,
            descricao: f.turma,
          }))}
        />
      )}
    </>
  );
}
