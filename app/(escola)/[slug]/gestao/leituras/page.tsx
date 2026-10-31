import type { Metadata } from "next";
import { BookOpenCheck, Check, CircleDashed, EyeOff, UserRoundX } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { NavegarData } from "@/components/gestao/NavegarData";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { carregarPainel, type FamiliaPainel } from "@/lib/gestao/painel";
import { dataDoPainel } from "@/lib/gestao/data-painel";
import { horaDe } from "@/lib/agenda/data";

export const metadata: Metadata = { title: "Leituras das famílias" };

const SITUACAO: Record<FamiliaPainel["situacao"], { texto: string; Icone: typeof Check; classe: string }> = {
  lido: { texto: "Leu", Icone: Check, classe: "text-sucesso" },
  nao_lido: { texto: "Ainda não leu", Icone: CircleDashed, classe: "text-texto-2" },
  nao_liberado: { texto: "Dia ainda não finalizado", Icone: EyeOff, classe: "text-texto-2" },
  sem_responsavel: { texto: "Sem responsável vinculado", Icone: UserRoundX, classe: "text-texto-2" },
  sem_registro: { texto: "Sem registro no dia", Icone: CircleDashed, classe: "text-texto-2" },
};

export default async function Leituras({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ data?: string }> }) {
  const { slug } = await params;
  const data = dataDoPainel((await searchParams).data);
  const escola = await exigirPapel(slug, "gestor");
  const p = await carregarPainel(await clienteDaEscola(), escola.id, data);
  const porTurma = p.turmas.map((t) => ({ turma: t, familias: p.familias.filter((f) => f.turmaId === t.id) })).filter((g) => g.familias.length);

  return (
    <>
      <Titulo voltar={`/${slug}/gestao?data=${data}`}>Leituras das famílias</Titulo>
      <NavegarData data={data} href={(d) => `/${slug}/gestao/leituras?data=${d}`} />
      {porTurma.length === 0 ? (
        <EstadoVazio icone={BookOpenCheck} titulo="Nenhuma criança cadastrada" />
      ) : (
        porTurma.map(({ turma, familias }) => (
          <section key={turma.id} className="flex flex-col gap-2" aria-labelledby={`t-${turma.id}`}>
            <h2 id={`t-${turma.id}`} className="text-lg font-semibold">
              {turma.nome}
            </h2>
            <ul className="flex flex-col rounded-tc border border-neutra">
              {familias.map((f) => {
                const s = SITUACAO[f.situacao];
                return (
                  <li key={f.criancaId} className="flex min-h-14 flex-col justify-center border-b border-neutra px-4 py-2 last:border-b-0">
                    <span className="font-bold">{f.crianca}</span>
                    <span className={`flex items-center gap-1 text-sm ${s.classe}`}>
                      <s.Icone className="size-4 shrink-0" aria-hidden />
                      {s.texto}
                      {f.situacao === "lido" && f.lidoEm
                        ? ` às ${horaDe(f.lidoEm)}${f.lidoPor && p.nomes[f.lidoPor] ? ` (${p.nomes[f.lidoPor]})` : ""}`
                        : ""}
                    </span>
                    {f.vistoTrazer !== null ? (
                      <span className="text-sm text-texto-2">Trazer amanhã: {f.vistoTrazer ? "visto" : "ainda sem visto"}</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
