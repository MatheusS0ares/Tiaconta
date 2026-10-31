"use client";

import { lerValor } from "@/lib/agenda/tipos";
import { textoDoValor } from "@/lib/agenda/exibir";
import { Chip, GrupoChips } from "./comum";
import type { EntradaProps, ExibicaoProps } from "./tipos";

export function Entrada({ campo, atual, onRegistrar, desabilitado }: EntradaProps<"sim_nao">) {
  const marcado = atual ? lerValor("sim_nao", campo.opcoes, atual.valor)?.sim : undefined;
  return (
    <GrupoChips rotulo={campo.rotulo}>
      <Chip marcado={marcado === true} desabilitado={desabilitado} onClick={() => onRegistrar({ sim: true }, atual?.id)}>
        Sim
      </Chip>
      <Chip marcado={marcado === false} desabilitado={desabilitado} onClick={() => onRegistrar({ sim: false }, atual?.id)}>
        Não
      </Chip>
    </GrupoChips>
  );
}

export function Exibicao({ campo, valor, className = "" }: ExibicaoProps) {
  return <span className={className}>{textoDoValor("sim_nao", campo.opcoes, valor)}</span>;
}
