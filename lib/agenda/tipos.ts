/**
 * Tipos de campo da agenda (regra 6 do CLAUDE.md: campos são dados, não código).
 * - CONFIGURAÇÃO de cada campo (agenda_campos.opcoes): OPCOES_POR_TIPO
 * - VALOR registrado (agenda_registros.valor): schemaValor(tipo, opcoes)
 * O banco valida de novo (fn_valor_valido, 0006): estes schemas têm que bater com ele.
 */
import { z } from "zod";
import type { Database } from "../supabase/database.types.ts";
import { normalizarHora } from "./hora.ts";

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

// ---------------------------------------------------------------- valor registrado

/** Hora tolerante na entrada ("9h30"), sempre "HH:MM" na saída. */
export const hora = z
  .string()
  .transform((t, ctx) => {
    const h = normalizarHora(t);
    if (!h) {
      ctx.addIssue({ code: "custom", message: "Hora inválida. Ex.: 9h30" });
      return z.NEVER;
    }
    return h;
  });

const obs = z
  .string()
  .trim()
  .max(500, "Use até 500 letras.")
  .optional()
  .transform((t) => (t ? t : undefined));

const naLista = (lista: string[]) => (v: string) => lista.length === 0 || lista.includes(v);

/**
 * Schema do valor de um campo, dado o tipo e a configuração dele.
 * Formatos: tabela "Formato do valor por tipo de campo" do CLAUDE.md.
 */
export function schemaValor(tipo: TipoCampo, configuracao: unknown) {
  const lista = opcoesDoCampo(configuracao);
  switch (tipo) {
    case "opcao":
      return z.object({ opcao: z.string().refine(naLista(lista), "Escolha uma das opções.") });
    case "sim_nao":
      return z.object({ sim: z.boolean() });
    case "evento":
      return z.object({
        hora,
        opcao: z.string().refine(naLista(lista), "Escolha uma das opções.").optional(),
        obs,
      });
    case "intervalo":
      return z.object({ inicio: hora, fim: hora.nullable().optional().transform((f) => f ?? null) });
    case "quantidade":
      return z.object({
        quantidade: z.coerce.number({ message: "Informe um número." }).min(0, "Não pode ser negativo.").max(10000),
        hora: hora.optional(),
      });
    case "texto":
      return z.object({ texto: z.string().trim().min(1, "Escreva alguma coisa.").max(2000, "Use até 2000 letras.") });
    case "checklist":
      return z.object({
        itens: z.array(z.string()).refine((itens) => itens.every(naLista(lista)), "Item fora da lista."),
        obs,
      });
  }
}

export type ValorPorTipo = {
  opcao: { opcao: string };
  sim_nao: { sim: boolean };
  evento: { hora: string; opcao?: string; obs?: string };
  intervalo: { inicio: string; fim: string | null };
  quantidade: { quantidade: number; hora?: string };
  texto: { texto: string };
  checklist: { itens: string[]; obs?: string };
};

/** Lê um valor salvo com tolerância (null se estiver fora do formato). */
export function lerValor<T extends TipoCampo>(tipo: T, configuracao: unknown, valor: unknown): ValorPorTipo[T] | null {
  const r = schemaValor(tipo, configuracao).safeParse(valor);
  return r.success ? (r.data as ValorPorTipo[T]) : null;
}
