import type { Database } from "@/lib/supabase/database.types";

export type Papel = Database["public"]["Enums"]["papel_membro"];

/** Prioridade quando o usuário tem mais de um papel na mesma escola. */
export const ORDEM_PAPEIS: Papel[] = ["gestor", "professora", "responsavel"];

/** Segmento de rota de cada papel dentro de /[slug]. */
export const ROTA_DO_PAPEL: Record<Papel, string> = {
  gestor: "gestao",
  professora: "professora",
  responsavel: "responsavel",
};

export const NOME_DO_PAPEL: Record<Papel, string> = {
  gestor: "Gestão",
  professora: "Professora",
  responsavel: "Responsável",
};

export function papelPrincipal(papeis: Papel[]): Papel | undefined {
  return ORDEM_PAPEIS.find((p) => papeis.includes(p));
}
