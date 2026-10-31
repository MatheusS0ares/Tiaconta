"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirPapel } from "@/lib/escola";
import { criarClienteServidor } from "@/lib/supabase/server";
import { OPCOES_POR_TIPO, TIPOS_COM_OPCOES, type TipoCampo } from "@/lib/agenda/tipos";
import type { Json } from "@/lib/supabase/database.types";

export type EstadoForm = { erros?: Record<string, string>; erro?: string };

export async function alternarCampo(slug: string, id: string, ativo: boolean) {
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("agenda_campos").update({ ativo }).eq("id", id).eq("escola_id", escola.id);
  revalidatePath(`/${slug}/gestao/campos`);
  return { ok: !error };
}

/** Move o campo uma posição para cima/baixo, renumerando a ordem (10, 20, 30…). */
export async function moverCampo(slug: string, id: string, direcao: -1 | 1) {
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await criarClienteServidor();
  const { data: campos } = await supabase
    .from("agenda_campos")
    .select("id, ordem")
    .eq("escola_id", escola.id)
    .order("ordem")
    .order("rotulo");
  if (!campos) return { ok: false };
  const ids = campos.map((c) => c.id);
  const i = ids.indexOf(id);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= ids.length) return { ok: true };
  [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  const atual = new Map(campos.map((c) => [c.id, c.ordem]));
  const mudancas = ids
    .map((cid, k) => ({ id: cid, ordem: (k + 1) * 10 }))
    .filter((m) => atual.get(m.id) !== m.ordem);
  const resultados = await Promise.all(
    mudancas.map((m) => supabase.from("agenda_campos").update({ ordem: m.ordem }).eq("id", m.id).eq("escola_id", escola.id)),
  );
  revalidatePath(`/${slug}/gestao/campos`);
  return { ok: resultados.every((r) => !r.error) };
}

const base = z.object({
  rotulo: z.string().trim().min(2, "Dê um nome ao campo.").max(40, "Use até 40 letras."),
  faixas: z.array(z.enum(["bercario", "maternal", "pre_escola", "fundamental"])),
  visivel_responsavel: z.boolean(),
  multiplo: z.boolean(),
  grupo: z.enum(["dia", "alimentacao", "sono", "cuidados", "recados", "trazer"]),
  destaque: z.enum(["nenhum", "atencao", "alerta"]).transform((d) => (d === "nenhum" ? null : d)),
  pede_visto: z.boolean(),
  destaque_opcoes: z.array(z.string()),
  destaque_acima: z
    .string()
    .transform((t) => t.replace(",", ".").trim())
    .refine((t) => t === "" || !Number.isNaN(Number(t)), "Use um número. Ex.: 37,5")
    .transform((t) => (t === "" ? null : Number(t))),
});

export async function salvarCampo(slug: string, id: string, _: EstadoForm, form: FormData): Promise<EstadoForm> {
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await criarClienteServidor();
  const { data: campo } = await supabase
    .from("agenda_campos")
    .select("tipo, opcoes")
    .eq("id", id)
    .eq("escola_id", escola.id)
    .maybeSingle();
  if (!campo) return { erro: "Campo não encontrado." };

  const dados = base.safeParse({
    rotulo: form.get("rotulo") ?? "",
    faixas: form.getAll("faixas"),
    visivel_responsavel: form.get("visivel_responsavel") === "on",
    multiplo: form.get("multiplo") === "on",
    grupo: form.get("grupo") ?? "cuidados",
    destaque: form.get("destaque") ?? "nenhum",
    pede_visto: form.get("pede_visto") === "on",
    destaque_opcoes: form.getAll("destaque_opcoes").map(String),
    destaque_acima: String(form.get("destaque_acima") ?? ""),
  });
  const tipo = campo.tipo as TipoCampo;
  const brutoOpcoes: Record<string, unknown> = {};
  if (TIPOS_COM_OPCOES.includes(tipo)) {
    brutoOpcoes.opcoes = form.getAll("opcoes").map(String).map((o) => o.trim()).filter(Boolean);
  }
  if (tipo === "quantidade") brutoOpcoes.unidade = String(form.get("unidade") ?? "");
  const opcoes = OPCOES_POR_TIPO[tipo].safeParse(brutoOpcoes);

  const erros: Record<string, string> = {};
  if (!dados.success) for (const i of dados.error.issues) erros[String(i.path[0])] = i.message;
  if (!opcoes.success) for (const i of opcoes.error.issues) erros[String(i.path[0] ?? "opcoes")] = i.message;
  if (!dados.success || !opcoes.success) return { erros };

  // preserva chaves de configuração que esta tela não edita
  const novasOpcoes: { [k: string]: Json | undefined } = { ...(campo.opcoes as Record<string, Json>), ...opcoes.data };
  // condições de destaque (lib/agenda/excecao.ts): só opções que existem
  const lista = (opcoes.data as { opcoes?: string[] }).opcoes ?? [];
  const destaqueOpcoes = dados.data.destaque_opcoes.filter((o) => lista.includes(o));
  if (destaqueOpcoes.length) novasOpcoes.destaque_opcoes = destaqueOpcoes;
  else delete novasOpcoes.destaque_opcoes;
  if (tipo === "quantidade" && dados.data.destaque_acima !== null) novasOpcoes.destaque_acima = dados.data.destaque_acima;
  else delete novasOpcoes.destaque_acima;
  const { error } = await supabase
    .from("agenda_campos")
    .update({
      rotulo: dados.data.rotulo,
      faixas: dados.data.faixas.length ? dados.data.faixas : null, // nenhuma = todas as faixas
      visivel_responsavel: dados.data.visivel_responsavel,
      multiplo: dados.data.multiplo,
      grupo: dados.data.grupo,
      destaque: dados.data.destaque,
      pede_visto: dados.data.pede_visto,
      opcoes: novasOpcoes,
    })
    .eq("id", id)
    .eq("escola_id", escola.id);
  if (error) return { erro: "Não conseguimos salvar. Tente de novo." };

  revalidatePath(`/${slug}/gestao/campos`);
  redirect(`/${slug}/gestao/campos`);
}

export async function criarCamposPadrao(slug: string) {
  const escola = await exigirPapel(slug, "gestor");
  const supabase = await criarClienteServidor();
  // security invoker: o RLS de agenda_campos garante que só o gestor insere.
  await supabase.rpc("criar_campos_padrao", { p_escola: escola.id });
  revalidatePath(`/${slug}/gestao/campos`);
}
