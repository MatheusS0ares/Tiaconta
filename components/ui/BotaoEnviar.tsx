"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { Botao } from "./Botao";
import type { ComponentProps } from "react";

/** Botão de submit que mostra "carregando" enquanto a server action roda. */
export function BotaoEnviar({
  children,
  textoEnviando,
  ...props
}: ComponentProps<typeof Botao> & { textoEnviando?: string }) {
  const { pending } = useFormStatus();
  // Até a página hidratar, o envio nativo pode ser abortado pela hidratação
  // (visto nos testes): o botão só libera quando o React está no controle.
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);
  return (
    <Botao type="submit" {...props} disabled={!pronto || pending || props.disabled} aria-busy={pending}>
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
