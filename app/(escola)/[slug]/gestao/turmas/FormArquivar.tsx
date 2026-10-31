"use client";

import { useActionState } from "react";
import { BotaoConfirmar } from "@/components/ui/BotaoConfirmar";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Aviso } from "@/components/ui/Aviso";
import { alternarArquivoTurma, type EstadoForm } from "./actions";

export function FormArquivar({ slug, id, ativa }: { slug: string; id: string; ativa: boolean }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(alternarArquivoTurma.bind(null, slug, id, !ativa), {});
  return (
    <form action={acao} className="flex flex-col gap-3">
      {estado.erro ? <Aviso tipo="erro">{estado.erro}</Aviso> : null}
      {ativa ? (
        <BotaoConfirmar>Arquivar turma</BotaoConfirmar>
      ) : (
        <BotaoEnviar variante="secundaria">Reativar turma</BotaoEnviar>
      )}
    </form>
  );
}
