"use client";

import { useActionState } from "react";
import { Campo } from "@/components/ui/Campo";
import { BotaoEnviar } from "@/components/ui/BotaoEnviar";
import { Aviso } from "@/components/ui/Aviso";
import { enviarLink, verificarCodigo, type EstadoLogin } from "./actions";

export function FormLogin({ next, erroInicial }: { next: string; erroInicial?: string }) {
  const [estadoEmail, acaoEmail] = useActionState<EstadoLogin, FormData>(enviarLink, {
    etapa: "email",
    erro: erroInicial,
  });
  const [estadoCodigo, acaoCodigo] = useActionState<EstadoLogin, FormData>(verificarCodigo, { etapa: "email" });

  const email = estadoEmail.etapa === "codigo" ? estadoEmail.email : undefined;

  if (email) {
    const erro = estadoCodigo.etapa === "codigo" ? estadoCodigo.erro : undefined;
    return (
      <div className="flex flex-col gap-6">
        <Aviso tipo="sucesso">
          Enviamos um e-mail para <strong className="break-all">{email}</strong>.
        </Aviso>
        <p>Toque no botão do e-mail ou digite aqui o código de 6 números:</p>
        <form action={acaoCodigo} className="flex flex-col gap-6">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <Campo
            rotulo="Código"
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={7}
            required
            autoFocus
            erro={erro}
            className="text-center text-2xl tracking-[0.4em]"
          />
          <BotaoEnviar variante="marca" textoEnviando="Entrando…">
            Entrar
          </BotaoEnviar>
        </form>
        <form action={acaoEmail}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <BotaoEnviar variante="texto" textoEnviando="Reenviando…">
            Reenviar e-mail
          </BotaoEnviar>
        </form>
      </div>
    );
  }

  return (
    <form action={acaoEmail} className="flex flex-col gap-6">
      <input type="hidden" name="next" value={next} />
      <Campo
        rotulo="Seu e-mail"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="nome@gmail.com"
        defaultValue={estadoEmail.email}
        required
        erro={estadoEmail.erro}
      />
      <BotaoEnviar variante="marca" textoEnviando="Enviando…">
        Receber link de acesso
      </BotaoEnviar>
    </form>
  );
}
