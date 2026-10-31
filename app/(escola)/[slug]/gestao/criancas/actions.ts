"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirPapel } from "@/lib/escola";
import { criarClienteServidor } from "@/lib/supabase/server";
import { BUCKET_FOTOS } from "@/lib/fotos";

export type EstadoForm = { erros?: Record<string, string>; erro?: string; ok?: boolean; destino?: string };

const textoOpcional = z
  .string()
  .trim()
  .max(500, "Use até 500 letras.")
  .transform((t) => (t === "" ? null : t));

const schema = z.object({
  nome: z.string().trim().min(2, "Escreva o nome da criança.").max(80, "Use até 80 letras."),
  data_nascimento: z
    .string()
    .transform((t) => (t === "" ? null : t))
    .refine((t) => t === null || (/^\d{4}-\d{2}-\d{2}$/.test(t) && new Date(t) <= new Date()), "Data inválida."),
  turma_id: z.guid({ message: "Escolha a turma." }),
  autoriza_imagem: z.boolean(),
  restricoes_alimentares: textoOpcional,
  observacoes_saude: textoOpcional,
});

export async function salvarCrianca(slug: string, id: string | null, _: EstadoForm, form: FormData): Promise<EstadoForm> {
  const escola = await exigirPapel(slug, "gestor");
  const dados = schema.safeParse({
    nome: form.get("nome") ?? "",
    data_nascimento: form.get("data_nascimento") ?? "",
    turma_id: form.get("turma_id") ?? undefined,
    autoriza_imagem: form.get("autoriza_imagem") === "on",
    restricoes_alimentares: form.get("restricoes_alimentares") ?? "",
    observacoes_saude: form.get("observacoes_saude") ?? "",
  });
  if (!dados.success) {
    return { erros: Object.fromEntries(dados.error.issues.map((i) => [String(i.path[0]), i.message])) };
  }

  const supabase = await criarClienteServidor();
  if (id) {
    const { error } = await supabase.from("criancas").update(dados.data).eq("id", id).eq("escola_id", escola.id);
    if (error) return { erro: "Não conseguimos salvar. Tente de novo." };
    revalidatePath(`/${slug}/gestao`, "layout");
    return { ok: true };
  }
  const { data, error } = await supabase
    .from("criancas")
    .insert({ escola_id: escola.id, ...dados.data })
    .select("id")
    .single();
  if (error || !data) return { erro: "Não conseguimos cadastrar. Tente de novo." };
  // navegação pelo cliente (useDestino): redirect + revalidatePath travava o formulário às vezes
  return { destino: `/${slug}/gestao/criancas/${data.id}?nova=1` };
}

export async function alternarArquivoCrianca(slug: string, id: string, ativar: boolean) {
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await criarClienteServidor();
  await supabase.from("criancas").update({ ativa: ativar }).eq("id", id).eq("escola_id", escola.id);
  return { destino: `/${slug}/gestao/criancas` };
}

const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];

export async function enviarFoto(slug: string, id: string, form: FormData): Promise<EstadoForm> {
  const escola = await exigirPapel(slug, "gestor");
  const arquivo = form.get("foto");
  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: "Escolha uma foto." };
  if (!TIPOS_FOTO.includes(arquivo.type)) return { erro: "Use uma foto JPG, PNG ou WebP." };
  if (arquivo.size > 2 * 1024 * 1024) return { erro: "A foto está grande demais (máx. 2 MB)." };

  const supabase = await criarClienteServidor();
  const { data: crianca } = await supabase
    .from("criancas")
    .select("foto_path")
    .eq("id", id)
    .eq("escola_id", escola.id)
    .maybeSingle();
  if (!crianca) return { erro: "Criança não encontrada." };

  // RLS do Storage (0005): só o gestor grava em {escola}/{criança}/...
  const extensao = arquivo.type.split("/")[1]!.replace("jpeg", "jpg");
  const caminho = `${escola.id}/${id}/${crypto.randomUUID()}.${extensao}`;
  const { error } = await supabase.storage.from(BUCKET_FOTOS).upload(caminho, arquivo, { contentType: arquivo.type });
  if (error) return { erro: "Não conseguimos enviar a foto. Tente de novo." };

  await supabase.from("criancas").update({ foto_path: caminho }).eq("id", id).eq("escola_id", escola.id);
  if (crianca.foto_path) await supabase.storage.from(BUCKET_FOTOS).remove([crianca.foto_path]);
  revalidatePath(`/${slug}/gestao`, "layout");
  return { ok: true };
}

export async function removerFoto(slug: string, id: string) {
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await criarClienteServidor();
  const { data: crianca } = await supabase
    .from("criancas")
    .select("foto_path")
    .eq("id", id)
    .eq("escola_id", escola.id)
    .maybeSingle();
  if (crianca?.foto_path) {
    await supabase.storage.from(BUCKET_FOTOS).remove([crianca.foto_path]);
    await supabase.from("criancas").update({ foto_path: null }).eq("id", id).eq("escola_id", escola.id);
  }
  revalidatePath(`/${slug}/gestao`, "layout");
}

/**
 * Remove o vínculo responsável–criança. Se a pessoa ficar sem nenhuma criança
 * na escola, o papel de responsável é desativado (ela perde o acesso).
 */
export async function removerResponsavel(slug: string, criancaId: string, userId: string) {
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await criarClienteServidor();
  await supabase
    .from("responsaveis_criancas")
    .delete()
    .eq("crianca_id", criancaId)
    .eq("user_id", userId)
    .eq("escola_id", escola.id);
  const { count } = await supabase
    .from("responsaveis_criancas")
    .select("crianca_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("escola_id", escola.id);
  if (!count) {
    await supabase
      .from("membros")
      .update({ ativo: false })
      .eq("user_id", userId)
      .eq("escola_id", escola.id)
      .eq("papel", "responsavel");
  }
  revalidatePath(`/${slug}/gestao`, "layout");
}
