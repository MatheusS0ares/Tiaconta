"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Campo } from "@/components/ui/Campo";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Aviso } from "@/components/ui/Aviso";
import { salvarBoasVindas, type EstadoBoasVindas } from "./actions";

type Props = {
  next: string;
  nome?: string;
  telefone?: string;
  pedirConsentimento: boolean;
};

export function FormBoasVindas({ next, nome, telefone, pedirConsentimento }: Props) {
  const [estado, acao] = useActionState<EstadoBoasVindas, FormData>(salvarBoasVindas, {});
  const erros = estado.erros ?? {};

  return (
    <form action={acao} className="flex flex-1 flex-col gap-6">
      <input type="hidden" name="next" value={next} />
      <Campo rotulo="Como podemos te chamar?" name="nome" autoComplete="name" defaultValue={nome} required erro={erros.nome} />
      <Campo
        rotulo="Celular (opcional)"
        name="telefone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="(61) 99999-0000"
        defaultValue={telefone}
        erro={erros.telefone}
      />
      {pedirConsentimento ? (
        <div className="flex flex-col gap-2">
          <label className="flex min-h-12 items-start gap-3 rounded-tc border-2 border-neutra p-4">
            <input type="checkbox" name="consentimento" className="mt-1 size-6 shrink-0 accent-[var(--escola-primaria)]" />
            <span>
              Li e aceito o{" "}
              <Link href="/privacidade" target="_blank" className="font-bold underline underline-offset-4">
                termo de uso e privacidade
              </Link>
              . A escola vai registrar a rotina do meu filho no TiaConta.
            </span>
          </label>
          {erros.consentimento ? <p className="text-sm font-semibold text-alerta">{erros.consentimento}</p> : null}
        </div>
      ) : null}
      {erros.geral ? <Aviso tipo="erro">{erros.geral}</Aviso> : null}
      <div className="mt-auto">
        <BotaoEnviar variante="marca" textoEnviando="Salvando…">
          Continuar
        </BotaoEnviar>
      </div>
    </form>
  );
}
