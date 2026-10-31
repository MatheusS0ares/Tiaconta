"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * Ação destrutiva sem modal: o primeiro toque pede confirmação no próprio
 * botão por 4s, o segundo envia o formulário.
 */
export function BotaoConfirmar({ children, confirmar = "Toque de novo para confirmar" }: { children: ReactNode; confirmar?: string }) {
  const [armado, setArmado] = useState(false);
  const { pending } = useFormStatus();
  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), 4000);
    return () => clearTimeout(t);
  }, [armado]);

  return (
    <button
      type={armado ? "submit" : "button"}
      onClick={(e) => {
        if (!armado) {
          e.preventDefault();
          setArmado(true);
        }
      }}
      disabled={pending}
      className={
        "min-h-12 rounded-tc px-2 font-bold text-alerta underline underline-offset-4 disabled:opacity-60 " +
        (armado ? "bg-superficie px-4 no-underline" : "")
      }
    >
      <span aria-live="polite">{pending ? "Aguarde…" : armado ? confirmar : children}</span>
    </button>
  );
}
