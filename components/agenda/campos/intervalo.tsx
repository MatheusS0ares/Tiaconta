"use client";

import { useId, useState } from "react";
import { lerValor, schemaValor } from "@/lib/agenda/tipos";
import { textoDoValor } from "@/lib/agenda/exibir";
import { horaAgora } from "@/lib/agenda/data";
import { BotaoRegistrar, CampoHora, ErroCampo, useHora } from "./comum";
import type { EntradaProps, ExibicaoProps } from "./tipos";

/**
 * Início e fim (ex.: sono). Pode registrar sem fim ("ainda dormindo") e
 * depois tocar em "Acordou agora" (UX.md, Postel).
 */
export function Entrada({ campo, atual, onRegistrar, desabilitado }: EntradaProps<"intervalo">) {
  const id = useId();
  const inicio = useHora();
  const fim = useHora("");
  const [erro, setErro] = useState<string | null>(null);
  const aberto = atual ? lerValor("intervalo", campo.opcoes, atual.valor) : null;

  if (aberto && !aberto.fim && atual) {
    return (
      <div className="flex flex-col gap-3">
        <p>Dormindo desde {aberto.inicio}</p>
        <BotaoRegistrar
          desabilitado={desabilitado}
          onClick={() => onRegistrar({ inicio: aberto.inicio, fim: horaAgora() }, atual.id)}
        >
          Acordou agora
        </BotaoRegistrar>
      </div>
    );
  }

  const enviar = () => {
    const r = schemaValor("intervalo", campo.opcoes).safeParse({
      inicio: inicio.texto,
      fim: fim.texto.trim() ? fim.texto : null,
    });
    if (!r.success) return setErro(r.error.issues[0]?.message ?? "Confira os horários.");
    setErro(null);
    fim.setTexto("");
    onRegistrar(r.data as never);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <CampoHora rotulo="Início" hora={inicio} id={`${id}-inicio`} />
        <CampoHora rotulo="Fim" hora={fim} id={`${id}-fim`} opcional />
      </div>
      <p className="text-sm text-texto-2">Sem fim = ainda dormindo.</p>
      <BotaoRegistrar desabilitado={desabilitado} onClick={enviar} />
      <ErroCampo erro={erro} />
    </div>
  );
}

export function Exibicao({ campo, valor, className = "" }: ExibicaoProps) {
  return <span className={`tabular-nums ${className}`}>{textoDoValor("intervalo", campo.opcoes, valor)}</span>;
}
