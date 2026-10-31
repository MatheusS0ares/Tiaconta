"use client";

import { useOptimistic, useTransition } from "react";
import { Check } from "lucide-react";
import { marcarVisto } from "@/app/(escola)/[slug]/responsavel/actions";

/** "Visto" com retorno visual positivo imediato (UX.md §4, Peak-End). */
export function BotaoVisto({ slug, registroId, visto }: { slug: string; registroId: string; visto: boolean }) {
  const [marcado, marcarOtimista] = useOptimistic(visto, () => true);
  const [, iniciar] = useTransition();

  if (marcado) {
    return (
      <p role="status" className="flex min-h-12 items-center justify-center gap-2 rounded-tc border-2 border-sucesso font-bold text-sucesso">
        <Check className="size-5" aria-hidden />
        Visto! A escola já sabe.
      </p>
    );
  }
  return (
    <button
      type="button"
      onClick={() =>
        iniciar(async () => {
          marcarOtimista(true);
          await marcarVisto(slug, registroId);
        })
      }
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-tc bg-primaria font-bold text-primaria-texto active:scale-[0.98]"
    >
      <Check className="size-5" aria-hidden />
      Visto
    </button>
  );
}
