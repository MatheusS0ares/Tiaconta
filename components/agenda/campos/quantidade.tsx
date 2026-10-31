"use client";

import { useId, useState } from "react";
import { schemaValor, unidadeDoCampo } from "@/lib/agenda/tipos";
import { textoDoValor } from "@/lib/agenda/exibir";
import { BotaoRegistrar, CampoHora, ErroCampo, useHora } from "./comum";
import type { EntradaProps, ExibicaoProps } from "./tipos";

/** Quantidade com unidade da configuração (ml, °C…) e hora atual preenchida. */
export function Entrada({ campo, onRegistrar, desabilitado }: EntradaProps<"quantidade">) {
  const id = useId();
  const [qtd, setQtd] = useState("");
  const hora = useHora();
  const [erro, setErro] = useState<string | null>(null);
  const unidade = unidadeDoCampo(campo.opcoes);

  const enviar = () => {
    const r = schemaValor("quantidade", campo.opcoes).safeParse({
      quantidade: qtd.replace(",", ".").trim() === "" ? undefined : qtd.replace(",", "."),
      hora: hora.texto,
    });
    if (!r.success) return setErro(r.error.issues[0]?.message ?? "Informe a quantidade.");
    setErro(null);
    setQtd("");
    onRegistrar(r.data as never);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-qtd`} className="text-sm font-bold">
            Quantidade{unidade ? ` (${unidade})` : ""}
          </label>
          <input
            id={`${id}-qtd`}
            value={qtd}
            onChange={(e) => setQtd(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            className="min-h-12 w-28 rounded-tc border-2 border-neutra bg-fundo px-3 text-center text-lg tabular-nums focus:border-texto focus:outline-none"
          />
        </div>
        <CampoHora rotulo="Hora" hora={hora} id={`${id}-hora`} />
      </div>
      <BotaoRegistrar desabilitado={desabilitado} onClick={enviar} />
      <ErroCampo erro={erro} />
    </div>
  );
}

export function Exibicao({ campo, valor, className = "" }: ExibicaoProps) {
  return <span className={`tabular-nums ${className}`}>{textoDoValor("quantidade", campo.opcoes, valor)}</span>;
}
