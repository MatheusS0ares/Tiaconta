"use server";

import { z } from "zod";
import { exigirPapel } from "@/lib/escola";
import { criarClienteServidor } from "@/lib/supabase/server";

export type EstadoForm = { erros?: Record<string, string>; erro?: string; destino?: string };

const schema = z.object({
  nome: z.string().trim().min(2, "Dê um nome para a turma.").max(40, "Use até 40 letras."),
  faixa: z.enum(["bercario", "maternal", "pre_escola", "fundamental"], { message: "Escolha a faixa etária." }),
  professoras: z.array(z.guid()),
});

export async function salvarTurma(slug: string, id: string | null, _: EstadoForm, form: FormData): Promise<EstadoForm> {
  const escola = await exigirPapel(slug, "gestor");
  const dados = schema.safeParse({
    nome: form.get("nome") ?? "",
    faixa: form.get("faixa") ?? undefined,
    professoras: form.getAll("professoras"),
  });
  if (!dados.success) {
    return { erros: Object.fromEntries(dados.error.issues.map((i) => [String(i.path[0]), i.message])) };
  }

  const supabase = await criarClienteServidor();
  const { nome, faixa, professoras } = dados.data;
  let turmaId = id;
  if (id) {
    const { error } = await supabase.from("turmas").update({ nome, faixa }).eq("id", id).eq("escola_id", escola.id);
    if (error) return { erro: "Não conseguimos salvar. Tente de novo." };
  } else {
    const { data, error } = await supabase.from("turmas").insert({ escola_id: escola.id, nome, faixa }).select("id").single();
    if (error || !data) return { erro: "Não conseguimos criar a turma. Tente de novo." };
    turmaId = data.id;
  }

  // Sincroniza professoras da turma (RLS: só gestor escreve em turma_professoras).
  const { data: atuais } = await supabase.from("turma_professoras").select("user_id").eq("turma_id", turmaId!);
  const atuaisIds = new Set((atuais ?? []).map((t) => t.user_id));
  const novas = professoras.filter((p) => !atuaisIds.has(p));
  const removidas = [...atuaisIds].filter((p) => !professoras.includes(p));
  if (removidas.length) await supabase.from("turma_professoras").delete().eq("turma_id", turmaId!).in("user_id", removidas);
  if (novas.length) {
    await supabase
      .from("turma_professoras")
      .insert(novas.map((user_id) => ({ turma_id: turmaId!, escola_id: escola.id, user_id })));
  }

  return { destino: `/${slug}/gestao/turmas` };
}

export async function alternarArquivoTurma(slug: string, id: string, ativar: boolean, _: EstadoForm): Promise<EstadoForm> {
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await criarClienteServidor();
  if (!ativar) {
    const { count } = await supabase
      .from("criancas")
      .select("id", { count: "exact", head: true })
      .eq("turma_id", id)
      .eq("ativa", true);
    if (count) return { erro: `A turma ainda tem ${count} ${count === 1 ? "criança" : "crianças"}. Mude-as de turma antes de arquivar.` };
  }
  await supabase.from("turmas").update({ ativa: ativar }).eq("id", id).eq("escola_id", escola.id);
  return { destino: `/${slug}/gestao/turmas` };
}
