/** Modelo do dia de uma turma, compartilhado entre servidor (carga) e cliente (estado otimista). */
import type { TipoCampo } from "./tipos.ts";

export type CampoDia = { id: string; rotulo: string; tipo: TipoCampo; opcoes: unknown; multiplo: boolean };

export type CriancaDia = {
  id: string;
  nome: string;
  fotoUrl: string | null;
  restricoes: string | null;
  saude: string | null;
};

export type DiaCrianca = {
  status: "rascunho" | "finalizado";
  faltou: boolean;
  finalizadoPor: string | null;
  finalizadoEm: string | null;
};

export type RegistroDia = {
  id: string;
  criancaId: string;
  campoId: string;
  valor: unknown;
  registradoPor: string | null;
  registradoEm: string;
  loteId: string | null;
  pendente?: boolean; // ainda na fila (não confirmado pelo servidor)
};

export type TurmaDia = {
  turma: { id: string; nome: string; faixa: string };
  data: string;
  usuarioId: string;
  eGestor: boolean;
  criancas: CriancaDia[];
  campos: CampoDia[];
  dias: Record<string, DiaCrianca>;
  registros: RegistroDia[];
  mural: { texto: string; autor: string | null; atualizadoEm: string | null };
  nomes: Record<string, string>; // user_id → primeiro nome (autoria)
  /** muda a cada carga do servidor; usado para descartar operações já refletidas */
  versao: number;
};

export type StatusCrianca = "pendente" | "andamento" | "finalizado" | "faltou";

export function statusDa(estado: TurmaDia, criancaId: string): StatusCrianca {
  const dia = estado.dias[criancaId];
  if (dia?.status === "finalizado") return "finalizado";
  if (dia?.faltou) return "faltou";
  return estado.registros.some((r) => r.criancaId === criancaId) ? "andamento" : "pendente";
}

/** "Completa" = dia finalizado ou falta (combinado no plano). */
export function progresso(estado: TurmaDia) {
  const status = estado.criancas.map((c) => statusDa(estado, c.id));
  return {
    total: status.length,
    completas: status.filter((s) => s === "finalizado" || s === "faltou").length,
    pendentes: estado.criancas.filter((_, i) => status[i] === "pendente"),
    finalizadas: status.filter((s) => s === "finalizado").length,
  };
}

export function diaEditavel(estado: TurmaDia, criancaId: string) {
  return estado.eGestor || estado.dias[criancaId]?.status !== "finalizado";
}
