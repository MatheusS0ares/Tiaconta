"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Botao } from "./Botao";
import type { ComponentProps } from "react";

/** Botão de submit que mostra "carregando" enquanto a server action roda. */
export function BotaoEnviar({
  children,
  textoEnviando,
  ...props
}: ComponentProps<typeof Botao> & { textoEnviando?: string }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending || props.disabled} aria-busy={pending} {...props}>
      {pending ? (
        <>
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
          {textoEnviando ?? "Enviando…"}
        </>
      ) : (
        children
      )}
    </Botao>
  );
}
