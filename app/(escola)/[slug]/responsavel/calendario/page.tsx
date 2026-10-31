import type { Metadata } from "next";
import Link from "next/link";
import { Baby, ChevronLeft, ChevronRight, CircleCheck, UserX } from "lucide-react";
import { Titulo } from "@/components/ui/Titulo";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { escolaAtual, clienteDaEscola } from "@/lib/escola";
import { hoje } from "@/lib/agenda/data";

export const metadata: Metadata = { title: "Calendário" };

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const NOME_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const mesLongo = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

function mesValido(m?: string) {
  return !!m && /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
}
function somarMes(m: string, n: number) {
  const [a, mm] = m.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(a, mm - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

/** Calendário dos dias anteriores (padrão conhecido, UX.md §2 Jakob). */
export default async function Calendario({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ crianca?: string; mes?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const escola = await escolaAtual(slug);
  const supabase = await clienteDaEscola();
  const hojeEscola = hoje();
  const mesAtual = hojeEscola.slice(0, 7);
  const mes = mesValido(sp.mes) && sp.mes! <= mesAtual ? sp.mes! : mesAtual;

  const { data: filhos } = await supabase.from("criancas").select("id, nome").eq("escola_id", escola.id).eq("ativa", true).order("nome");
  if (!filhos?.length) {
    return (
      <>
        <Titulo>Calendário</Titulo>
        <EstadoVazio icone={Baby} titulo="Nenhuma criança vinculada">
          <p>Peça para a escola enviar o convite com o nome do seu filho.</p>
        </EstadoVazio>
      </>
    );
  }
  const crianca = filhos.find((f) => f.id === sp.crianca) ?? filhos[0]!;

  const inicio = `${mes}-01`;
  const fim = `${somarMes(mes, 1)}-01`;
  // RLS: só os dias visíveis para o responsável (finalizados, se a escola exigir).
  const { data: dias } = await supabase
    .from("agenda_dias")
    .select("data, status, faltou")
    .eq("crianca_id", crianca.id)
    .gte("data", inicio)
    .lt("data", fim);
  const porData = new Map((dias ?? []).map((d) => [d.data, d]));

  const [a, m] = mes.split("-").map(Number) as [number, number];
  const primeiroDiaSemana = new Date(Date.UTC(a, m - 1, 1)).getUTCDay();
  const diasNoMes = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const celulas = [...Array(primeiroDiaSemana).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => i + 1)];
  const base = `/${slug}/responsavel/calendario?crianca=${crianca.id}`;
  const primeiroNome = crianca.nome.split(" ")[0];

  return (
    <>
      <Titulo subtitulo={filhos.length > 1 ? undefined : `Dias de ${primeiroNome}`}>Calendário</Titulo>

      {filhos.length > 1 ? (
        <nav aria-label="Escolher filho" className="flex flex-wrap gap-2">
          {filhos.map((f) => (
            <Link
              key={f.id}
              href={`/${slug}/responsavel/calendario?crianca=${f.id}&mes=${mes}`}
              aria-current={f.id === crianca.id ? "page" : undefined}
              className={`flex min-h-12 items-center rounded-full border-2 px-4 font-semibold ${f.id === crianca.id ? "border-primaria bg-primaria text-primaria-texto" : "border-neutra"}`}
            >
              {f.nome.split(" ")[0]}
            </Link>
          ))}
        </nav>
      ) : null}

      <div className="flex items-center justify-between">
        <Link href={`${base}&mes=${somarMes(mes, -1)}`} aria-label="Mês anterior" className="flex size-12 items-center justify-center rounded-full">
          <ChevronLeft className="size-6" aria-hidden />
        </Link>
        <h2 className="text-lg font-semibold first-letter:uppercase">{mesLongo.format(new Date(`${mes}-15T12:00:00Z`))}</h2>
        {mes < mesAtual ? (
          <Link href={`${base}&mes=${somarMes(mes, 1)}`} aria-label="Próximo mês" className="flex size-12 items-center justify-center rounded-full">
            <ChevronRight className="size-6" aria-hidden />
          </Link>
        ) : (
          <span className="size-12" aria-hidden />
        )}
      </div>

      <div className="-mx-2">
        <div className="grid grid-cols-7 text-center text-sm font-bold text-texto-2" aria-hidden>
          {SEMANA.map((s, i) => (
            <span key={i} className="py-1">
              {s}
            </span>
          ))}
        </div>
        <ol className="grid grid-cols-7">
          {celulas.map((n, i) => {
            if (n === null) return <li key={`v${i}`} aria-hidden />;
            const data = `${mes}-${String(n).padStart(2, "0")}`;
            const dia = porData.get(data);
            const futuro = data > hojeEscola;
            const eHoje = data === hojeEscola;
            const semana = NOME_SEMANA[(primeiroDiaSemana + n - 1) % 7];
            const descricao = dia ? (dia.faltou ? "faltou" : dia.status === "finalizado" ? "dia finalizado" : "em andamento") : "sem registros";
            const conteudo = (
              <>
                <span className={`tabular-nums ${eHoje ? "font-bold" : ""}`}>{n}</span>
                {dia?.faltou ? (
                  <UserX className="size-4 text-atencao" aria-hidden />
                ) : dia?.status === "finalizado" ? (
                  <CircleCheck className="size-4 text-sucesso" aria-hidden />
                ) : dia ? (
                  <span className="size-2 rounded-full bg-texto-2" aria-hidden />
                ) : (
                  <span className="size-4" aria-hidden />
                )}
              </>
            );
            const classe = `flex h-14 min-w-12 flex-col items-center justify-center gap-0.5 rounded-tc ${eHoje ? "ring-2 ring-texto" : ""}`;
            return (
              <li key={data}>
                {futuro ? (
                  <span className={`${classe} text-texto-2 opacity-50`}>{conteudo}</span>
                ) : (
                  <Link href={`/${slug}/responsavel/${crianca.id}?dia=${data}`} aria-label={`${semana}, ${n}: ${descricao}`} className={`${classe} active:bg-superficie`}>
                    {conteudo}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-texto-2">
        <li className="flex items-center gap-1"><CircleCheck className="size-4 text-sucesso" aria-hidden /> Dia finalizado</li>
        <li className="flex items-center gap-1"><span className="size-2 rounded-full bg-texto-2" aria-hidden /> Em andamento</li>
        <li className="flex items-center gap-1"><UserX className="size-4 text-atencao" aria-hidden /> Faltou</li>
      </ul>
    </>
  );
}
