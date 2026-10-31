import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/** Professoras ativas da escola com nome (perfis), ordenadas. */
export async function professorasDaEscola(supabase: SupabaseClient<Database>, escolaId: string) {
  const [{ data: membros }, { data: perfis }] = await Promise.all([
    supabase.from("membros").select("user_id").eq("escola_id", escolaId).eq("papel", "professora").eq("ativo", true),
    supabase.from("perfis").select("user_id, nome"),
  ]);
  const nomes = new Map((perfis ?? []).map((p) => [p.user_id, p.nome]));
  return (membros ?? [])
    .map((m) => ({ id: m.user_id, nome: nomes.get(m.user_id) ?? "Sem nome" }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

const dataCurta = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" });

/** Idade amigável: "8 meses", "1 ano e 3 meses", "4 anos". */
export function idade(nascimento: string | null, hoje = new Date()) {
  if (!nascimento) return null;
  const [a, m, d] = nascimento.split("-").map(Number) as [number, number, number];
  let meses = (hoje.getFullYear() - a) * 12 + (hoje.getMonth() + 1 - m);
  if (hoje.getDate() < d) meses -= 1;
  if (meses < 0) return null;
  if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const txtAnos = `${anos} ${anos === 1 ? "ano" : "anos"}`;
  return anos < 3 && resto ? `${txtAnos} e ${resto} ${resto === 1 ? "mês" : "meses"}` : txtAnos;
}

export function formatarData(iso: string) {
  return dataCurta.format(new Date(iso + "T12:00:00"));
}
