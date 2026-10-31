import type { Metadata } from "next";
import { SetaLink } from "@/components/ui/SetaLink";
import Link from "next/link";
import { CircleCheck, Clock, School } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { NavegarData } from "@/components/gestao/NavegarData";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { carregarPainel } from "@/lib/gestao/painel";
import { dataDoPainel } from "@/lib/gestao/data-painel";
import { horaDe } from "@/lib/agenda/data";

export const metadata: Metadata = { title: "Turmas do dia" };

export default async function TurmasDoDia({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ data?: string }> }) {
  const { slug } = await params;
  const data = dataDoPainel((await searchParams).data);
  const escola = await exigirPapel(slug, "gestor");
  const p = await carregarPainel(await clienteDaEscola(), escola.id, data);

  return (
    <>
      <Titulo voltar={`/${slug}/gestao?data=${data}`}>Turmas do dia</Titulo>
      <NavegarData data={data} href={(d) => `/${slug}/gestao/dia?data=${d}`} />
      {p.turmas.length === 0 ? (
        <EstadoVazio icone={School} titulo="Nenhuma turma ativa" />
      ) : (
        <ul className="flex flex-col gap-3">
          {p.turmas.map((t) => {
            const completas = t.finalizadas;
            return (
              <li key={t.id}>
                <Link href={`/${slug}/gestao/agenda/${t.id}/${data}`} className="flex min-h-20 items-center gap-3 rounded-tc border border-neutra p-4">
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="font-bold">{t.nome}</span>
                    {t.finalizada ? (
                      <span className="flex items-center gap-1 text-sm font-semibold text-sucesso">
                        <CircleCheck className="size-4" aria-hidden />
                        Finalizada{t.finalizadaEm ? ` às ${horaDe(t.finalizadaEm)}` : ""}
                        {t.finalizadaPor && p.nomes[t.finalizadaPor] ? ` por ${p.nomes[t.finalizadaPor]!.split(" ")[0]}` : ""}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm font-semibold text-atencao">
                        <Clock className="size-4" aria-hidden />
                        Pendente · {completas} de {t.total} finalizadas
                      </span>
                    )}
                    <span className="text-sm text-texto-2">
                      {[t.faltas ? `${t.faltas} ${t.faltas === 1 ? "falta" : "faltas"}` : null, t.pendentes ? `${t.pendentes} sem registro` : null]
                        .filter(Boolean)
                        .join(" · ") || "Todas com registro"}
                    </span>
                  </span>
                  <SetaLink className="size-5 text-texto-2" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-sm text-texto-2">Toque na turma para ver e corrigir a agenda do dia. Toda correção fica registrada com o seu nome.</p>
    </>
  );
}
