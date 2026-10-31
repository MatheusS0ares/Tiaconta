import Link from "next/link";
import { CalendarDays, CircleAlert, CircleCheck, Clock, TriangleAlert, UserX } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { horaDe, formatarDataLonga } from "@/lib/agenda/data";
import type { Grupo, ItemResumo, Resumo } from "@/lib/agenda/resumo";
import { BotaoVisto } from "./BotaoVisto";
import { MarcarLeitura } from "./MarcarLeitura";

/** Cards na ordem do UX.md §4 (Posição Serial): o dia → rotina → turma → recado → trazer amanhã. */
const CARDS: { grupo: Grupo; titulo: string }[] = [
  { grupo: "alimentacao", titulo: "Alimentação" },
  { grupo: "sono", titulo: "Sono" },
  { grupo: "cuidados", titulo: "Higiene e saúde" },
];

const ESTILO_DESTAQUE = {
  alerta: { classe: "border-l-4 border-alerta pl-3 text-alerta", Icone: TriangleAlert },
  atencao: { classe: "border-l-4 border-atencao pl-3 text-atencao", Icone: CircleAlert },
} as const;

function Linha({ item, ocultarRotulo }: { item: ItemResumo; ocultarRotulo?: boolean }) {
  const d = item.destacado && item.nivel ? ESTILO_DESTAQUE[item.nivel] : null;
  return (
    <li className={`flex flex-col gap-0.5 ${d?.classe ?? ""}`}>
      <span className={`flex items-center gap-1 text-sm font-bold ${ocultarRotulo && !d ? "sr-only" : ""}`}>
        {d ? <d.Icone className="size-4 shrink-0" aria-hidden /> : null}
        {item.rotulo}
        {d ? <span className="sr-only">{item.nivel === "alerta" ? " (alerta)" : " (atenção)"}</span> : null}
      </span>
      <span className={`tabular-nums ${d ? "font-semibold" : "text-texto"}`}>{item.textos.join(" · ")}</span>
    </li>
  );
}

function Card({ titulo, itens, children, className = "" }: { titulo: string; itens?: ItemResumo[]; children?: React.ReactNode; className?: string }) {
  return (
    <section className={`flex flex-col gap-3 rounded-tc border border-neutra p-4 ${className}`}>
      <h2 className="text-lg font-semibold">{titulo}</h2>
      {itens ? (
        <ul className="flex flex-col gap-3">
          {itens.map((i) => (
            <Linha key={i.campoId} item={i} ocultarRotulo={itens.length === 1 && i.rotulo === titulo} />
          ))}
        </ul>
      ) : null}
      {children}
    </section>
  );
}

export function ResumoDia({ resumo, slug, nomes, hoje }: { resumo: Resumo; slug: string; nomes: Record<string, string>; hoje: string }) {
  const { crianca, dia, itens } = resumo;
  const primeiroNome = crianca.nome.split(" ")[0];
  const doGrupo = (g: Grupo) => itens.filter((i) => i.grupo === g);
  const comoFoi = doGrupo("dia");
  const recados = doGrupo("recados");
  const trazer = doGrupo("trazer").filter((i) => i.textos.some((t) => t !== "Nada"));
  const finalizado = dia?.status === "finalizado";
  const eHoje = resumo.data === hoje;

  return (
    <>
      {dia ? <MarcarLeitura slug={slug} diaId={dia.id} /> : null}

      {/* (1) Como foi o dia + foto */}
      <section className="flex flex-col items-center gap-3 rounded-tc bg-superficie px-4 py-6 text-center">
        <Avatar nome={crianca.nome} url={crianca.fotoUrl} tamanho={96} />
        <div>
          <h1 className="text-2xl font-semibold">{eHoje ? `O dia de ${primeiroNome}` : primeiroNome}</h1>
          <p className="text-texto-2 first-letter:uppercase">{formatarDataLonga(resumo.data)}</p>
        </div>
        {dia?.faltou ? (
          <p className="flex items-center gap-2 font-semibold text-atencao">
            <UserX className="size-5" aria-hidden />
            {primeiroNome} faltou {eHoje ? "hoje" : "neste dia"}.
          </p>
        ) : (
          comoFoi.map((i) => (
            <p key={i.campoId} className={`text-xl font-semibold ${i.destacado ? "text-atencao" : ""}`}>
              {i.textos.join(" · ")}
            </p>
          ))
        )}
        {finalizado ? (
          <p className="flex items-center gap-1 text-sm font-semibold text-sucesso">
            <CircleCheck className="size-4" aria-hidden />
            Dia finalizado{dia?.finalizadoEm ? ` às ${horaDe(dia.finalizadoEm)}` : ""}
            {dia?.finalizadoPor && nomes[dia.finalizadoPor] ? ` por ${nomes[dia.finalizadoPor]}` : ""}
          </p>
        ) : dia && !dia.faltou ? (
          <p className="flex items-center gap-1 text-sm text-texto-2">
            <Clock className="size-4" aria-hidden />
            A professora ainda está registrando.
          </p>
        ) : null}
      </section>

      {!dia || (itens.length === 0 && !dia.faltou && !resumo.mural) ? (
        <p className="rounded-tc border border-neutra p-4 text-center text-texto-2">
          {eHoje
            ? `Ainda não há registros do dia de ${primeiroNome}. Volte mais tarde: quando a professora finalizar, tudo aparece aqui.`
            : "Não há registros neste dia."}
        </p>
      ) : null}

      {/* (2) Blocos de rotina */}
      {CARDS.map(({ grupo, titulo }) => {
        const doCard = doGrupo(grupo);
        return doCard.length ? <Card key={grupo} titulo={titulo} itens={doCard} /> : null;
      })}

      {/* Mural da turma: visualmente separado do recado individual (UX.md §4) */}
      {resumo.mural ? (
        <section className="flex flex-col gap-2 rounded-tc bg-superficie p-4">
          <h2 className="text-lg font-semibold">Na turma hoje</h2>
          <p className="text-sm text-texto-2">Para todas as famílias da turma{crianca.turma ? ` (${crianca.turma})` : ""}</p>
          <p className="whitespace-pre-line">{resumo.mural}</p>
        </section>
      ) : null}

      {/* (3) Recado individual */}
      {recados.length ? (
        <Card titulo={`Recado para a família de ${primeiroNome}`} className="border-2 border-texto">
          {recados.map((r) => (
            <p key={r.campoId} className="whitespace-pre-line text-lg">
              {r.textos.join("\n")}
            </p>
          ))}
        </Card>
      ) : null}

      {/* (4) Trazer amanhã, por último */}
      {trazer.map((t) => (
        <Card key={t.campoId} titulo={t.rotulo} className={t.destacado ? "border-2 border-atencao" : ""}>
          <p className="text-lg font-semibold">{t.textos.join(" · ")}</p>
          {t.pedeVisto && t.registroId ? <BotaoVisto slug={slug} registroId={t.registroId} visto={t.visto} /> : null}
        </Card>
      ))}

      <Link
        href={`/${slug}/responsavel/calendario?crianca=${crianca.id}&mes=${resumo.data.slice(0, 7)}`}
        className="flex min-h-12 items-center justify-center gap-2 font-bold underline underline-offset-4"
      >
        <CalendarDays className="size-5" aria-hidden />
        Ver outros dias
      </Link>
    </>
  );
}
