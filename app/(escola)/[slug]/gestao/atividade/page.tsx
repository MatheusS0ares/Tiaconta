import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Megaphone, PencilLine, RefreshCw } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { NavegarData } from "@/components/gestao/NavegarData";
import { exigirPapel, clienteDaEscola } from "@/lib/escola";
import { carregarPainel, type Evento } from "@/lib/gestao/painel";
import { dataDoPainel } from "@/lib/gestao/data-painel";
import { horaDe } from "@/lib/agenda/data";

export const metadata: Metadata = { title: "Atividade da equipe" };

const ICONE: Record<Evento["tipo"], typeof PencilLine> = { registro: PencilLine, edicao: RefreshCw, finalizacao: CircleCheck, mural: Megaphone };
const chip = "flex min-h-12 shrink-0 items-center rounded-full border-2 px-4 font-semibold";

/** Quem registrou o quê e quando — fatos, sem ranking (UX.md §5, viés cognitivo). */
export default async function Atividade({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ data?: string; quem?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const data = dataDoPainel(sp.data);
  const escola = await exigirPapel(slug, "gestor");
  const p = await carregarPainel(await clienteDaEscola(), escola.id, data);
  const base = `/${slug}/gestao/atividade?data=${data}`;
  const eventos = sp.quem ? p.eventos.filter((e) => e.quem === sp.quem) : p.eventos;

  return (
    <>
      <Titulo voltar={`/${slug}/gestao?data=${data}`}>Atividade da equipe</Titulo>
      <NavegarData data={data} href={(d) => `/${slug}/gestao/atividade?data=${d}${sp.quem ? `&quem=${sp.quem}` : ""}`} />

      {p.professoras.length ? (
        <section aria-label="Por professora" className="flex flex-col gap-2">
          <ul className="flex flex-col gap-2">
            {p.professoras.map((pr) => (
              <li key={pr.id} className="flex min-h-12 items-center justify-between rounded-tc bg-superficie px-4 py-2 text-sm">
                <span className="font-bold">{pr.nome}</span>
                <span className="text-texto-2">
                  {pr.registros} {pr.registros === 1 ? "registro" : "registros"}
                  {pr.ultimo ? ` · último às ${horaDe(pr.ultimo)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav aria-label="Filtrar por pessoa" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[{ id: undefined, nome: "Todos" }, ...p.professoras].map((pr) => {
          const ativo = (pr.id ?? null) === (sp.quem ?? null);
          return (
            <Link
              key={pr.id ?? "todos"}
              href={pr.id ? `${base}&quem=${pr.id}` : base}
              aria-current={ativo ? "page" : undefined}
              className={`${chip} ${ativo ? "border-primaria bg-primaria text-primaria-texto" : "border-neutra"}`}
            >
              {pr.nome.split(" ")[0]}
            </Link>
          );
        })}
      </nav>

      {eventos.length === 0 ? (
        <EstadoVazio icone={PencilLine} titulo="Nada registrado neste dia">
          <p>Os registros aparecem aqui assim que a equipe começar.</p>
        </EstadoVazio>
      ) : (
        <ol className="flex flex-col">
          {eventos.map((e, i) => {
            const Icone = ICONE[e.tipo];
            const destino = e.criancaId
              ? `/${slug}/gestao/agenda/${e.turmaId}/${data}/crianca/${e.criancaId}`
              : `/${slug}/gestao/agenda/${e.turmaId}/${data}/mural`;
            return (
              <li key={i}>
                <Link href={destino} className="flex min-h-14 items-start gap-3 border-b border-neutra py-2">
                  <span className="w-12 shrink-0 pt-0.5 text-sm tabular-nums text-texto-2">{horaDe(e.quando)}</span>
                  <Icone className="mt-0.5 size-4 shrink-0 text-texto-2" aria-hidden />
                  <span className="flex-1 text-sm">
                    <strong>{e.quem ? (p.nomes[e.quem]?.split(" ")[0] ?? "Alguém") : "Alguém"}</strong>
                    {e.crianca ? <> · {e.crianca.split(" ")[0]}</> : null}
                    <span className="block text-texto-2">{e.texto}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
