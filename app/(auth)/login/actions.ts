"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import { caminhoSeguro, urlDoSite } from "@/lib/navegacao";

export type EstadoLogin =
  | { etapa: "email"; erro?: string; email?: string }
  | { etapa: "codigo"; email: string; erro?: string };

const emailSchema = z.string().trim().toLowerCase().email();

export async function enviarLink(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const bruto = String(form.get("email") ?? "");
  const email = emailSchema.safeParse(bruto);
  if (!email.success) return { etapa: "email", email: bruto, erro: "Confira o e-mail. Ex.: nome@gmail.com" };

  const next = caminhoSeguro(String(form.get("next") ?? ""));
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${urlDoSite()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    const limite = error.status === 429 || /rate|security purposes/i.test(error.message);
    return {
      etapa: "email",
      email: email.data,
      erro: limite
        ? "Muitos pedidos seguidos. Aguarde 1 minuto e tente de novo."
        : "Não conseguimos enviar o e-mail agora. Tente de novo em instantes.",
    };
  }
  return { etapa: "codigo", email: email.data };
}

export async function verificarCodigo(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const email = emailSchema.safeParse(String(form.get("email") ?? ""));
  const token = String(form.get("codigo") ?? "").replace(/\D/g, "");
  if (!email.success) return { etapa: "email", erro: "Informe o e-mail de novo." };
  if (token.length !== 6) return { etapa: "codigo", email: email.data, erro: "O código tem 6 números." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.verifyOtp({ email: email.data, token, type: "email" });
  if (error) return { etapa: "codigo", email: email.data, erro: "Código inválido ou vencido. Confira o último e-mail." };

  redirect(caminhoSeguro(String(form.get("next") ?? "")));
}
