"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Botao } from "./Botao";

export function BotaoCopiar({ texto, rotulo = "Copiar link" }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <Botao
      variante="secundaria"
      onClick={async () => {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      }}
    >
      {copiado ? <Check className="size-5 text-sucesso" aria-hidden /> : <Copy className="size-5" aria-hidden />}
      <span aria-live="polite">{copiado ? "Copiado!" : rotulo}</span>
    </Botao>
  );
}
