/**
 * Registro dos componentes por tipo_campo (regra 6 do CLAUDE.md): a UI escolhe
 * o componente pelo `agenda_campos.tipo`, nunca pela chave do campo.
 * Um componente de Entrada e um de Exibição por tipo (UX.md, Similaridade).
 */
import type { ComponentType } from "react";
import type { TipoCampo } from "@/lib/agenda/tipos";
import type { EntradaProps, ExibicaoProps } from "./tipos";
import * as opcao from "./opcao";
import * as simNao from "./sim-nao";
import * as evento from "./evento";
import * as intervalo from "./intervalo";
import * as quantidade from "./quantidade";
import * as texto from "./texto";
import * as checklist from "./checklist";

const COMPONENTES_CAMPO: { [T in TipoCampo]: { Entrada: ComponentType<EntradaProps<T>>; Exibicao: ComponentType<ExibicaoProps> } } = {
  opcao,
  sim_nao: simNao,
  evento,
  intervalo,
  quantidade,
  texto,
  checklist,
};

/** Props da entrada sem o tipo do valor (para quem renderiza a partir dos dados). */
export type EntradaGenericaProps = Omit<EntradaProps, "onRegistrar"> & {
  onRegistrar: (valor: unknown, idExistente?: string) => void;
};

/** Componentes do tipo do campo (a escolha é por dado, nunca por chave). */
export function componentesDoTipo(tipo: TipoCampo) {
  const c = COMPONENTES_CAMPO[tipo];
  return {
    Entrada: c.Entrada as unknown as ComponentType<EntradaGenericaProps>,
    Exibicao: c.Exibicao,
  };
}

/** Tipos em que um toque no chip já registra (sem botão de confirmar). */
export const REGISTRO_IMEDIATO: TipoCampo[] = ["opcao", "sim_nao"];

export type { CampoAgenda, EntradaProps, ExibicaoProps, RegistroAtual } from "./tipos";
