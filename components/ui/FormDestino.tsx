"use client";

import { useActionState, type ReactNode } from "react";
import { useDestino } from "./useDestino";

type Resultado = { destino?: string } | void;

/**
 * Formulário para server actions que levam a outra página: a action devolve
 * { destino } e o cliente navega (ver useDestino).
 */
export function FormDestino({ acao, children, className }: { acao: () => Promise<Resultado>; children: ReactNode; className?: string }) {
  const [estado, executar] = useActionState<Resultado, FormData>(async () => acao(), undefined);
  useDestino(estado?.destino);
  return (
    <form action={executar} className={className}>
      {children}
    </form>
  );
}
