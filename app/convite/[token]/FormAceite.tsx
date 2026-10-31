"use client";

import { useActionState } from "react";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Aviso } from "@/components/ui/Aviso";
import { aceitarConvite, type EstadoAceite } from "./actions";

export function FormAceite({ token }: { token: string }) {
  const [estado, acao] = useActionState<EstadoAceite, FormData>(aceitarConvite.bind(null, token), {});
  return (
    <form action={acao} className="flex flex-col gap-4">
      {estado.erro ? <Aviso tipo="erro">{estado.erro}</Aviso> : null}
      <BotaoEnviar textoEnviando="Entrando…">Aceitar convite</BotaoEnviar>
    </form>
  );
}
