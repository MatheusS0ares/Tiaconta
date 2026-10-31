"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, CircleCheck, ListPlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { classesBotao } from "@/components/ui/Botao";
import { horaDe } from "@/lib/agenda/data";
import { progresso, statusDa } from "@/lib/agenda/modelo";
import { useAgenda } from "./AgendaProvider";
import { StatusCrianca } from "./StatusCrianca";

export function ListaTurma({ slug }: { slug: string }) {
  const { estado, acoes } = useAgenda();
  const [confirmando, setConfirmando] = useState(false);
  const p = progresso(estado);
  const base = `/${slug}/professora/turma/${estado.turma.id}`;
  const todasFinalizadas = p.total > 0 && p.finalizadas === p.total;
  const prontaParaFinalizar = p.pendentes.length === 0;
  const finalizacao = todasFinalizadas
    ? Object.values(estado.dias).find((d) => d.finalizadoEm)
    : undefined;

  if (p.total === 0) {
    return <p className="text-texto-2">Nenhuma criança nesta turma. Peça para a gestão cadastrar.</p>;
  }

  return (
    <>
      {/* Zeigarnik + Goal-Gradient: o progresso puxa */}
      <section aria-label="Progresso do dia" className="flex flex-col gap-2">
        <p className="text-lg">
          <strong className="font-marca text-2xl">{p.completas}</strong> de {p.total} {p.total === 1 ? "criança completa" : "crianças completas"}
        </p>
        <div className="h-3 overflow-hidden rounded-full bg-neutra" role="progressbar" aria-valuemin={0} aria-valuemax={p.total} aria-valuenow={p.completas}>
          <div className="h-full rounded-full bg-sucesso transition-[width] duration-200" style={{ width: `${(p.completas / p.total) * 100}%` }} />
        </div>
      </section>

      <ul className="flex flex-col gap-2">
        {estado.criancas.map((c) => {
          const status = statusDa(estado, c.id);
          const n = estado.registros.filter((r) => r.criancaId === c.id).length;
          return (
            <li key={c.id}>
              <Link href={`${base}/crianca/${c.id}`} className="flex min-h-16 items-center gap-3 rounded-tc border border-neutra px-3 py-2">
                <Avatar nome={c.nome} url={c.fotoUrl} />
                <span className="flex-1">
                  <span className="block font-bold">{c.nome}</span>
                  <StatusCrianca status={status} detalhe={n && status !== "faltou" ? `${n} ${n === 1 ? "registro" : "registros"}` : undefined} />
                </span>
                <ChevronRight className="size-5 text-texto-2" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>

      {todasFinalizadas ? (
        <p className="flex items-center gap-2 rounded-tc border-2 border-sucesso p-4 font-semibold text-sucesso" role="status">
          <CircleCheck className="size-5" aria-hidden />
          Dia finalizado{finalizacao?.finalizadoEm ? ` às ${horaDe(finalizacao.finalizadoEm)}` : ""}
          {finalizacao?.finalizadoPor && estado.nomes[finalizacao.finalizadoPor] ? ` por ${estado.nomes[finalizacao.finalizadoPor]}` : ""}.
        </p>
      ) : (
        <div className="sticky bottom-20 mt-auto flex flex-col gap-3 bg-fundo pt-2">
          {confirmando ? (
            <div className="flex flex-col gap-3 rounded-tc border-2 border-atencao p-4" role="alert">
              <p className="font-semibold">
                Ainda sem nenhum registro: {p.pendentes.map((c) => c.nome.split(" ")[0]).join(", ")}.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmando(false)} className={classesBotao("secundaria", true, "flex-1")}>
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmando(false);
                    acoes.finalizarTurma();
                  }}
                  className={classesBotao("secundaria", true, "flex-1")}
                >
                  Finalizar assim
                </button>
              </div>
            </div>
          ) : null}
          {/* Uma ação primária por vez (UX.md): "Finalizar" só ganha destaque quando
              ninguém está pendente; a primária fica embaixo, na zona do polegar. */}
          {prontaParaFinalizar ? (
            <>
              <Link href={`${base}/lote`} className={classesBotao("secundaria")}>
                <ListPlus className="size-5" aria-hidden />
                Registrar para a turma
              </Link>
              <button type="button" onClick={() => acoes.finalizarTurma()} className={classesBotao("primaria")}>
                <CircleCheck className="size-5" aria-hidden />
                Finalizar dia da turma
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setConfirmando(true)} className={classesBotao("secundaria")}>
                <CircleCheck className="size-5" aria-hidden />
                Finalizar dia da turma
              </button>
              <Link href={`${base}/lote`} className={classesBotao("primaria")}>
                <ListPlus className="size-5" aria-hidden />
                Registrar para a turma
              </Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
