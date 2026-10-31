import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirUsuario, minhasEscolas } from "@/lib/auth/sessao";
import type { Papel } from "@/lib/auth/papeis";

/**
 * Escola do slug atual + papéis do usuário nela. O RLS já garante que só
 * membros enxergam a escola; aqui só transformamos "não achei" em 404.
 */
export const escolaAtual = cache(async (slug: string) => {
  await exigirUsuario(`/${slug}`);
  const escola = (await minhasEscolas()).find((e) => e.slug === slug);
  if (!escola) notFound();
  return escola;
});

/** Exige um papel na escola; sem ele, volta para a entrada da escola. */
export async function exigirPapel(slug: string, papel: Papel) {
  const escola = await escolaAtual(slug);
  if (!escola.papeis.includes(papel)) redirect(`/${slug}`);
  return escola;
}

export const clienteDaEscola = cache(async () => criarClienteServidor());
