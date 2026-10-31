"use client";

import { useId, useState } from "react";
import { lerValor, opcoesDoCampo, schemaValor } from "@/lib/agenda/tipos";
import { textoDoValor } from "@/lib/agenda/exibir";
import { BotaoRegistrar, CampoObs, Chip, ErroCampo, GrupoChips } from "./comum";
import type { EntradaProps, ExibicaoProps } from "./tipos";

/** Lista para marcar (ex.: trazer amanhã). Marca vários e salva. */
export function Entrada({ campo, atual, onRegistrar, desabilitado }: EntradaProps<"checklist">) {
  const id = useId();
  const salvo = atual ? lerValor("checklist", campo.opcoes, atual.valor) : null;
  const [itens, setItens] = useState<string[]>(salvo?.itens ?? []);
  const [obs, setObs] = useState(salvo?.obs ?? "");
  const [erro, setErro] = useState<string | null>(null);

  const alternar = (o: string) => setItens(itens.includes(o) ? itens.filter((i) => i !== o) : [...itens, o]);
  const enviar = () => {
    const r = schemaValor("checklist", campo.opcoes).safeParse({ itens, obs });
    if (!r.success) return setErro(r.error.issues[0]?.message ?? "Confira os itens.");
    setErro(null);
    onRegistrar(r.data as never, atual?.id);
  };

  return (
    <div className="flex flex-col gap-3">
      <GrupoChips rotulo={campo.rotulo}>
        {opcoesDoCampo(campo.opcoes).map((o) => (
          <Chip key={o} marcado={itens.includes(o)} desabilitado={desabilitado} onClick={() => alternar(o)}>
            {o}
          </Chip>
        ))}
      </GrupoChips>
      <CampoObs valor={obs} onChange={setObs} id={`${id}-obs`} />
      <BotaoRegistrar desabilitado={desabilitado} onClick={enviar}>
        Salvar
      </BotaoRegistrar>
      <ErroCampo erro={erro} />
    </div>
  );
}

export function Exibicao({ campo, valor, className = "" }: ExibicaoProps) {
  return <span className={className}>{textoDoValor("checklist", campo.opcoes, valor)}</span>;
}
