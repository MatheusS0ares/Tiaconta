"use server";

import { z } from "zod";
import { exigirPapel } from "@/lib/escola";
import { criarClienteServidor } from "@/lib/supabase/server";
import { PARENTESCOS } from "@/lib/convites";

export type EstadoConvite = { erro?: string; destino?: string };

const schema = z.discriminatedUnion("papel", [
  z.object({
    papel: z.literal("professora"),
    turma_id: z.guid().optional(),
  }),
  z.object({
    papel: z.literal("responsavel"),
    crianca_id: z.guid("Escolha a criança."),
    parentesco: z.enum(PARENTESCOS).optional(),
  }),
]);

export async function criarConvite(slug: string, _: EstadoConvite, form: FormData): Promise<EstadoConvite> {
  const escola = await exigirPapel(slug, "gestor");
  const bruto = Object.fromEntries([...form.entries()].filter(([, v]) => v !== ""));
  const dados = schema.safeParse(bruto);
  if (!dados.success) return { erro: dados.error.issues[0]?.message ?? "Confira os dados do convite." };

  const supabase = await criarClienteServidor();
  // RLS: só o gestor da escola consegue inserir (convites_insert).
  const { data, error } = await supabase
    .from("convites")
    .insert({ escola_id: escola.id, ...dados.data })
    .select("id")
    .single();
  if (error || !data) return { erro: "Não conseguimos criar o convite. Tente de novo." };

  return { destino: `/${slug}/gestao/equipe/convite/${data.id}` };
}

export async function revogarConvite(slug: string, id: string) {
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await criarClienteServidor();
  await supabase
    .from("convites")
    .update({ revogado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("escola_id", escola.id)
    .is("aceito_em", null);
  return { destino: `/${slug}/gestao/equipe` };
}
