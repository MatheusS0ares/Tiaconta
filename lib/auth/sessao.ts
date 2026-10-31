import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Papel } from "./papeis";

export type Usuario = { id: string; email: string | null };

/** Usuário logado (validado pelo getClaims) ou null. Memoizado por requisição. */
export const obterUsuario = cache(async (): Promise<Usuario | null> => {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) return null;
  return { id: sub, email: (data.claims.email as string | undefined) ?? null };
});

export async function exigirUsuario(next = "/") {
  const usuario = await obterUsuario();
  if (!usuario) redirect(`/login?next=${encodeURIComponent(next)}`);
  return usuario;
}

export type EscolaDoUsuario = {
  id: string;
  slug: string;
  nome: string;
  logo_url: string | null;
  cor_primaria: string | null;
  papeis: Papel[];
};

/** Escolas em que o usuário é membro ativo, com os papéis em cada uma. */
export const minhasEscolas = cache(async (): Promise<EscolaDoUsuario[]> => {
  const usuario = await obterUsuario();
  if (!usuario) return [];
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("membros")
    .select("papel, escolas!inner(id, slug, nome, logo_url, cor_primaria)")
    .eq("user_id", usuario.id)
    .eq("ativo", true);
  if (error) throw error;

  const porEscola = new Map<string, EscolaDoUsuario>();
  for (const m of data ?? []) {
    const e = m.escolas;
    const atual = porEscola.get(e.id) ?? { ...e, papeis: [] };
    atual.papeis.push(m.papel);
    porEscola.set(e.id, atual);
  }
  return [...porEscola.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
});

/** Perfil do próprio usuário (null se ainda não preencheu as boas-vindas). */
export const meuPerfil = cache(async () => {
  const usuario = await obterUsuario();
  if (!usuario) return null;
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("perfis")
    .select("nome, telefone, consentimento_em")
    .eq("user_id", usuario.id)
    .maybeSingle();
  return data;
});

/** Precisa passar pelas boas-vindas? (sem nome, ou responsável sem consentimento LGPD) */
export async function precisaBoasVindas() {
  const [perfil, escolas] = await Promise.all([meuPerfil(), minhasEscolas()]);
  if (!perfil?.nome) return true;
  const eResponsavel = escolas.some((e) => e.papeis.includes("responsavel"));
  return eResponsavel && !perfil.consentimento_em;
}
