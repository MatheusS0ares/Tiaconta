"use client";

import { Botao } from "./Botao";

/** Sair: limpa as páginas guardadas offline neste aparelho antes de deslogar. */
export function BotaoSair() {
  return (
    <form
      action="/sair"
      method="post"
      onSubmit={() => navigator.serviceWorker?.controller?.postMessage("limpar")}
    >
      <Botao type="submit" variante="secundaria">
        Sair
      </Botao>
    </form>
  );
}
