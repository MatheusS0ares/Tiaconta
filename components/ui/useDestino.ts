"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Navega depois de uma server action que deu certo. Usado no lugar de
 * redirect() dentro da action: com revalidatePath + redirect, o Next 15 às
 * vezes deixava o formulário preso em "Salvando…" mesmo com o dado salvo
 * (visto nos testes E2E), e a pessoa tocava de novo e duplicava o cadastro.
 */
export function useDestino(destino: string | undefined) {
  const router = useRouter();
  useEffect(() => {
    if (destino) router.push(destino);
  }, [destino, router]);
  return !!destino;
}
