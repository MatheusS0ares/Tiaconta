/**
 * Tipos de campo da agenda (regra 6 do CLAUDE.md: campos são dados, não código).
 * Etapa 3: metadados e schema da CONFIGURAÇÃO (agenda_campos.opcoes).
 * Etapa 4 acrescenta aqui o schema do VALOR registrado (agenda_registros.valor).
 */
import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";

export type TipoCampo = Database["public"]["Enums"]["tipo_campo"];
export type FaixaEtaria = Database["public"]["Enums"]["faixa_etaria"];

export const FAIXAS: { valor: FaixaEtaria; rotulo: string }[] = [
  { valor: "bercario", rotulo: "Berçário" },
  { valor: "maternal", rotulo: "Maternal" },
  { valor: "pre_escola", rotulo: "Pré-escola" },
  { valor: "fundamental", rotulo: "Fundamental" },
];
export const NOME_FAIXA = Object.fromEntries(FAIXAS.map((f) => [f.valor, f.rotulo])) as Record<FaixaEtaria, string>;

/** Como a escola entende cada tipo (sem jargão de sistema). */
export const NOME_TIPO: Record<TipoCampo, string> = {
  opcao: "Escolha uma opção",
  sim_nao: "Sim ou não",
  evento: "Horário + tipo",
  intervalo: "Início e fim",
  quantidade: "Quantidade",
  texto: "Texto livre",
  checklist: "Lista para marcar",
};

const opcao = z.string().trim().min(1, "Opção vazia.").max(30, "Use até 30 letras por opção.");
const listaUnica = (min: number, max: number) =>
  z
    .array(opcao)
    .min(min, `Coloque pelo menos ${min} opções.`)
    .max(max, `No máximo ${max} opções.`)
    .refine((l) => new Set(l.map((o) => o.toLowerCase())).size === l.length, "Há opções repetidas.");

/** Schema de agenda_campos.opcoes por tipo. UX.md: escolha única com no máximo 5 opções. */
export const OPCOES_POR_TIPO = {
  opcao: z.object({ opcoes: listaUnica(2, 5) }),
  evento: z.object({ opcoes: listaUnica(0, 5).optional() }),
  checklist: z.object({ opcoes: listaUnica(1, 8) }),
  quantidade: z.object({ unidade: z.string().trim().min(1, "Informe a unidade (ex.: ml).").max(10) }),
  sim_nao: z.object({}),
  intervalo: z.object({}),
  texto: z.object({}),
} satisfies Record<TipoCampo, z.ZodType>;

/** Tipos cuja configuração tem lista de opções editável. */
export const TIPOS_COM_OPCOES: TipoCampo[] = ["opcao", "evento", "checklist"];
export const MAX_OPCOES: Partial<Record<TipoCampo, number>> = { opcao: 5, evento: 5, checklist: 8 };

/** Lê as opções configuradas com tolerância (dados antigos ou incompletos). */
export function opcoesDoCampo(opcoes: unknown): string[] {
  const lista = (opcoes as { opcoes?: unknown } | null)?.opcoes;
  return Array.isArray(lista) ? lista.filter((o): o is string => typeof o === "string") : [];
}

export function unidadeDoCampo(opcoes: unknown): string {
  const u = (opcoes as { unidade?: unknown } | null)?.unidade;
  return typeof u === "string" ? u : "";
}
