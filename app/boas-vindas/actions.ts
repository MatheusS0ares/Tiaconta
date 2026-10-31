"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import { minhasEscolas, obterUsuario } from "@/lib/auth/sessao";
import { caminhoSeguro } from "@/lib/navegacao";

export type EstadoBoasVindas = { erros?: { nome?: string; telefone?: string; consentimento?: string; geral?: string } };

const schema = z.object({
  nome: z.string().trim().min(2, "Escreva seu nome.").max(80, "Use até 80 letras."),
  // Postel: aceita qualquer formatação, guarda só os dígitos com DDD
  telefone: z
    .string()
    .transform((t) => t.replace(/\D/g, ""))
    .refine((t) => t === "" || (t.length >= 10 && t.length <= 13), "Telefone com DDD, ex.: (61) 99999-0000.")
    .transform((t) => (t === "" ? null : t)),
});

export async function salvarBoasVindas(_: EstadoBoasVindas, form: FormData): Promise<EstadoBoasVindas> {
  const usuario = await obterUsuario();
  if (!usuario) redirect("/login");

  const dados = schema.safeParse({ nome: form.get("nome") ?? "", telefone: form.get("telefone") ?? "" });
  const eResponsavel = (await minhasEscolas()).some((e) => e.papeis.includes("responsavel"));
  const aceitou = form.get("consentimento") === "on";

  const erros: NonNullable<EstadoBoasVindas["erros"]> = {};
  if (!dados.success) {
    for (const issue of dados.error.issues) erros[issue.path[0] as "nome" | "telefone"] = issue.message;
  }
  if (eResponsavel && !aceitou) erros.consentimento = "Para continuar, aceite o termo.";
  if (!dados.success || erros.consentimento) return { erros };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("perfis").upsert({
    user_id: usuario.id,
    nome: dados.data.nome,
    telefone: dados.data.telefone,
    ...(aceitou ? { consentimento_em: new Date().toISOString() } : {}),
  });
  if (error) return { erros: { geral: "Não conseguimos salvar agora. Tente de novo." } };

  redirect(caminhoSeguro(String(form.get("next") ?? "")));
}
