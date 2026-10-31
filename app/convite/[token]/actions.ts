"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { obterUsuario } from "@/lib/auth/sessao";

export type EstadoAceite = { erro?: string };

const MENSAGENS: Record<string, string> = {
  convite_usado: "Este convite já foi usado por outra pessoa. Peça um novo para a escola.",
  convite_expirado: "Este convite venceu. Peça um novo para a escola.",
  convite_revogado: "Este convite foi cancelado pela escola.",
  convite_invalido: "Convite não encontrado. Confira o link.",
};

export async function aceitarConvite(token: string, _: EstadoAceite): Promise<EstadoAceite> {
  if (!(await obterUsuario())) redirect(`/login?next=${encodeURIComponent(`/convite/${token}`)}`);

  const supabase = await criarClienteServidor();
  // RPC security definer: cria o membro e o vínculo sem service_role (0004_convites.sql).
  const { data: slug, error } = await supabase.rpc("aceitar_convite", { p_token: token });
  if (error || !slug) {
    const codigo = Object.keys(MENSAGENS).find((k) => error?.message.includes(k));
    return { erro: codigo ? MENSAGENS[codigo] : "Não conseguimos aceitar agora. Tente de novo." };
  }
  redirect(`/boas-vindas?next=${encodeURIComponent(`/${slug}`)}`);
}
