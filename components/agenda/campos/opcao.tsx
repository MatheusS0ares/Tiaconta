"use client";

import { opcoesDoCampo, lerValor } from "@/lib/agenda/tipos";
import { textoDoValor } from "@/lib/agenda/exibir";
import { Chip, GrupoChips } from "./comum";
import type { EntradaProps, ExibicaoProps } from "./tipos";

/** Escolha única: um toque registra (UX.md: ≤ 2 toques por item). */
export function Entrada({ campo, atual, onRegistrar, desabilitado }: EntradaProps<"opcao">) {
  const marcada = atual ? lerValor("opcao", campo.opcoes, atual.valor)?.opcao : undefined;
  return (
    <GrupoChips rotulo={campo.rotulo}>
      {opcoesDoCampo(campo.opcoes).map((o) => (
        <Chip key={o} marcado={o === marcada} desabilitado={desabilitado} onClick={() => onRegistrar({ opcao: o }, atual?.id)}>
          {o}
        </Chip>
      ))}
    </GrupoChips>
  );
}

export function Exibicao({ campo, valor, className = "" }: ExibicaoProps) {
  return <span className={className}>{textoDoValor("opcao", campo.opcoes, valor)}</span>;
}
