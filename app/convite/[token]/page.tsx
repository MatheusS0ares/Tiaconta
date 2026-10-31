import type { Metadata } from "next";
import Image from "next/image";
import { MailX, School } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { BotaoLink } from "@/components/ui/Botao";
import { criarClienteServidor } from "@/lib/supabase/server";
import { obterUsuario } from "@/lib/auth/sessao";
import { estiloCorEscola } from "@/lib/cor";
import { FormAceite } from "./FormAceite";

export const metadata: Metadata = { title: "Convite" };

const MOTIVO: Record<string, string> = {
  usado: "Este convite já foi usado. Cada link vale para uma pessoa: peça um novo para a escola.",
  expirado: "Este convite venceu. Peça um novo para a escola.",
  revogado: "Este convite foi cancelado pela escola.",
};

export default async function PaginaConvite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await criarClienteServidor();
  // ver_convite é security definer: mostra só o mínimo, inclusive sem login.
  const [{ data }, usuario] = await Promise.all([supabase.rpc("ver_convite", { p_token: token }), obterUsuario()]);
  const convite = data?.[0];

  if (!convite || convite.situacao !== "valido") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-8">
        <EstadoVazio icone={MailX} titulo="Convite indisponível" principal>
          <p>{convite ? MOTIVO[convite.situacao] : "Não encontramos este convite. Confira se o link veio completo."}</p>
        </EstadoVazio>
      </main>
    );
  }

  const descricao =
    convite.papel === "responsavel"
      ? `para acompanhar o dia de ${convite.crianca_nome} na escola.`
      : `para registrar a agenda${convite.turma_nome ? ` da turma ${convite.turma_nome}` : ""}.`;

  return (
    <main style={estiloCorEscola(convite.escola_cor_primaria)} className="flex min-h-dvh flex-col bg-superficie px-4 pb-8 pt-10">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="flex flex-col items-center gap-4 text-center">
          {convite.escola_logo_url ? (
            <Image src={convite.escola_logo_url} alt="" width={96} height={96} className="size-24 rounded-full object-cover" />
          ) : (
            <span className="flex size-24 items-center justify-center rounded-full bg-fundo">
              <School className="size-12" aria-hidden />
            </span>
          )}
          <h1 className="text-2xl font-semibold">{convite.escola_nome}</h1>
          <p className="text-lg">Você foi convidado(a) {descricao}</p>
        </div>
        <div className="mt-auto flex flex-col gap-6 pt-10">
          {usuario ? (
            <>
              <p className="text-center text-sm text-texto-2">Entrando como {usuario.email}</p>
              <FormAceite token={token} />
            </>
          ) : (
            <BotaoLink href={`/login?next=${encodeURIComponent(`/convite/${token}`)}`}>Entrar para aceitar</BotaoLink>
          )}
          <div className="flex justify-center">
            <Logo size={28} />
          </div>
        </div>
      </div>
    </main>
  );
}
