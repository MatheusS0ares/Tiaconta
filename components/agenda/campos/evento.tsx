"use client";

import { useId, useState } from "react";
import { opcoesDoCampo, schemaValor } from "@/lib/agenda/tipos";
import { textoDoValor } from "@/lib/agenda/exibir";
import { BotaoRegistrar, CampoHora, CampoObs, Chip, ErroCampo, GrupoChips, useHora } from "./comum";
import type { EntradaProps, ExibicaoProps } from "./tipos";

/**
 * Horário + tipo (ex.: troca de fralda). A hora atual já vem preenchida
 * (UX.md, Tesler): tocar no tipo registra. Sem opções (ex.: medicação),
 * registra com a observação.
 */
export function Entrada({ campo, onRegistrar, desabilitado }: EntradaProps<"evento">) {
  const id = useId();
  const hora = useHora();
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const opcoes = opcoesDoCampo(campo.opcoes);

  const enviar = (opcao?: string) => {
    const r = schemaValor("evento", campo.opcoes).safeParse({ hora: hora.texto, opcao, obs });
    if (!r.success) return setErro(r.error.issues[0]?.message ?? "Confira os dados.");
    setErro(null);
    setObs("");
    hora.setTexto(hora.valida ?? hora.texto);
    onRegistrar(r.data as never);
  };

  return (
    <div className="flex flex-col gap-3">
      <CampoHora rotulo="Hora" hora={hora} id={`${id}-hora`} />
      {opcoes.length ? (
        <GrupoChips rotulo={campo.rotulo}>
          {opcoes.map((o) => (
            <Chip key={o} desabilitado={desabilitado} onClick={() => enviar(o)}>
              {o}
            </Chip>
          ))}
        </GrupoChips>
      ) : null}
      <CampoObs valor={obs} onChange={setObs} id={`${id}-obs`} />
      {opcoes.length ? null : <BotaoRegistrar desabilitado={desabilitado} onClick={() => enviar()} />}
      <ErroCampo erro={erro} />
    </div>
  );
}

export function Exibicao({ campo, valor, className = "" }: ExibicaoProps) {
  return <span className={`tabular-nums ${className}`}>{textoDoValor("evento", campo.opcoes, valor)}</span>;
}
