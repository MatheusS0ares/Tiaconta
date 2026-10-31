"use server";

import { z } from "zod";
import { exigirPapel } from "@/lib/escola";
import { criarClienteServidor } from "@/lib/supabase/server";

const id = z.guid();

/** Confirmação de leitura: marcada ao abrir o resumo, sem botão (UX.md §4). */
export async function marcarLeitura(slug: string, diaId: string) {
  const escola = await exigirPapel(slug, "responsavel");
  if (!id.safeParse(diaId).success) return;
  const supabase = await criarClienteServidor();
  // RLS (leit_insert): só o próprio usuário e só em dia visível para ele.
  await supabase
    .from("agenda_leituras")
    .upsert({ agenda_dia_id: diaId, escola_id: escola.id }, { onConflict: "agenda_dia_id,user_id", ignoreDuplicates: true });
}

/** "Visto" no trazer amanhã (campos com pede_visto). */
export async function marcarVisto(slug: string, registroId: string) {
  const escola = await exigirPapel(slug, "responsavel");
  if (!id.safeParse(registroId).success) return { ok: false };
  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("agenda_vistos")
    .upsert({ registro_id: registroId, escola_id: escola.id }, { onConflict: "registro_id,user_id", ignoreDuplicates: true });
  return { ok: !error };
}
