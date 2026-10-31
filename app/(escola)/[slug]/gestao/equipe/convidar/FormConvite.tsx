"use client";

import { useActionState, type ReactNode } from "react";
import { Send } from "lucide-react";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Aviso } from "@/components/ui/Aviso";
import { criarConvite, type EstadoConvite } from "../actions";

export function FormConvite({ slug, papel, children }: { slug: string; papel: string; children: ReactNode }) {
  const [estado, acao] = useActionState<EstadoConvite, FormData>(criarConvite.bind(null, slug), {});
  return (
    <form action={acao} className="flex flex-1 flex-col gap-6">
      <input type="hidden" name="papel" value={papel} />
      {children}
      {estado.erro ? <Aviso tipo="erro">{estado.erro}</Aviso> : null}
      <div className="sticky bottom-20 mt-auto bg-fundo pt-2">
        <BotaoEnviar textoEnviando="Criando…">
          <Send className="size-5" aria-hidden />
          Criar convite
        </BotaoEnviar>
      </div>
    </form>
  );
}
