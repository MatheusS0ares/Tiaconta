"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { Aviso } from "@/components/ui/Aviso";
import { alternarCampo, moverCampo } from "./actions";

export type CampoLista = { id: string; rotulo: string; descricao: string; ativo: boolean };

type Acao = { tipo: "mover"; id: string; direcao: -1 | 1 } | { tipo: "alternar"; id: string; ativo: boolean };

function aplicar(lista: CampoLista[], a: Acao): CampoLista[] {
  if (a.tipo === "alternar") return lista.map((c) => (c.id === a.id ? { ...c, ativo: a.ativo } : c));
  const i = lista.findIndex((c) => c.id === a.id);
  const j = i + a.direcao;
  if (i < 0 || j < 0 || j >= lista.length) return lista;
  const nova = [...lista];
  [nova[i], nova[j]] = [nova[j]!, nova[i]!];
  return nova;
}

const botaoSeta =
  "flex size-12 items-center justify-center rounded-full text-texto disabled:opacity-30 active:bg-superficie";

/** Lista com UI otimista: a mudança aparece na hora e sincroniza em seguida. */
export function ListaCampos({ slug, campos }: { slug: string; campos: CampoLista[] }) {
  const [lista, otimista] = useOptimistic(campos, aplicar);
  const [, iniciar] = useTransition();
  const [erro, setErro] = useState(false);

  const executar = (a: Acao) =>
    iniciar(async () => {
      otimista(a);
      setErro(false);
      const r = a.tipo === "mover" ? await moverCampo(slug, a.id, a.direcao) : await alternarCampo(slug, a.id, a.ativo);
      if (!r.ok) setErro(true);
    });

  return (
    <>
      {erro ? <Aviso tipo="erro">Não conseguimos salvar a última mudança. Confira a conexão.</Aviso> : null}
      <ul className="flex flex-col gap-2">
        {lista.map((c, i) => (
          <li
            key={c.id}
            className={`flex items-center gap-1 rounded-tc border border-neutra py-1 pl-1 pr-3 ${c.ativo ? "" : "bg-superficie"}`}
          >
            <div className="flex flex-col">
              <button type="button" aria-label={`Subir ${c.rotulo}`} className={botaoSeta} disabled={i === 0} onClick={() => executar({ tipo: "mover", id: c.id, direcao: -1 })}>
                <ChevronUp className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                aria-label={`Descer ${c.rotulo}`}
                className={botaoSeta}
                disabled={i === lista.length - 1}
                onClick={() => executar({ tipo: "mover", id: c.id, direcao: 1 })}
              >
                <ChevronDown className="size-5" aria-hidden />
              </button>
            </div>
            <Link href={`/${slug}/gestao/campos/${c.id}`} className="flex min-h-24 flex-1 items-center gap-2 py-2">
              <span className="flex-1">
                <span className={`block font-bold ${c.ativo ? "" : "text-texto-2"}`}>{c.rotulo}</span>
                <span className="block text-sm text-texto-2">{c.ativo ? c.descricao : "Desligado"}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-texto-2" aria-hidden />
            </Link>
            <label className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center">
              <span className="sr-only">{c.ativo ? `Desligar ${c.rotulo}` : `Ligar ${c.rotulo}`}</span>
              <input
                type="checkbox"
                role="switch"
                className="peer sr-only"
                checked={c.ativo}
                onChange={(e) => executar({ tipo: "alternar", id: c.id, ativo: e.target.checked })}
              />
              <span
                aria-hidden
                className={
                  "relative h-8 w-14 rounded-full bg-neutra transition-colors duration-150 " +
                  "after:absolute after:left-1 after:top-1 after:size-6 after:rounded-full after:bg-fundo after:shadow after:transition-transform after:duration-150 " +
                  "peer-checked:bg-texto peer-checked:after:translate-x-6 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-texto"
                }
              />
            </label>
          </li>
        ))}
      </ul>
    </>
  );
}
