import type { TipoCampo, ValorPorTipo } from "@/lib/agenda/tipos";

/** Campo da agenda como a UI precisa (vindo de agenda_campos). */
export type CampoAgenda = {
  id: string;
  rotulo: string;
  tipo: TipoCampo;
  opcoes: unknown; // configuração (jsonb)
  multiplo: boolean;
};

export type RegistroAtual = { id: string; valor: unknown };

export type EntradaProps<T extends TipoCampo = TipoCampo> = {
  campo: CampoAgenda;
  /** registro existente (campo de valor único) ou o último aberto (sono sem fim) */
  atual?: RegistroAtual | null;
  /** chamado com o valor já validado; idExistente = atualizar aquele registro */
  onRegistrar: (valor: ValorPorTipo[T], idExistente?: string) => void;
  desabilitado?: boolean;
};

export type ExibicaoProps = { campo: CampoAgenda; valor: unknown; className?: string };
