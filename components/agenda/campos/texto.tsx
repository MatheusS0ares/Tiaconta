"use client";

import { useId, useState } from "react";
import { lerValor, schemaValor } from "@/lib/agenda/tipos";
import { textoDoValor } from "@/lib/agenda/exibir";
import { BotaoRegistrar, ErroCampo } from "./comum";
import type { EntradaProps, ExibicaoProps } from "./tipos";

/** Texto livre (ex.: recado individual para a família). */
export function Entrada({ campo, atual, onRegistrar, desabilitado }: EntradaProps<"texto">) {
  const id = useId();
  const inicial = atual ? (lerValor("texto", campo.opcoes, atual.valor)?.texto ?? "") : "";
  const [texto, setTexto] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);

  const enviar = () => {
    const r = schemaValor("texto", campo.opcoes).safeParse({ texto });
    if (!r.success) return setErro(r.error.issues[0]?.message ?? "Escreva alguma coisa.");
    setErro(null);
    onRegistrar(r.data as never, atual?.id);
  };

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={id} className="sr-only">
        {campo.rotulo}
      </label>
      <textarea
        id={id}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        maxLength={2000}
        className="w-full rounded-tc border-2 border-neutra bg-fundo px-4 py-3 text-base focus:border-texto focus:outline-none"
      />
      <BotaoRegistrar desabilitado={desabilitado || texto.trim() === inicial.trim()} onClick={enviar}>
        Salvar
      </BotaoRegistrar>
      <ErroCampo erro={erro} />
    </div>
  );
}

export function Exibicao({ campo, valor, className = "" }: ExibicaoProps) {
  return <span className={`whitespace-pre-line ${className}`}>{textoDoValor("texto", campo.opcoes, valor)}</span>;
}
