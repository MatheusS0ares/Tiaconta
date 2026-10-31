"use client";

import { useEffect } from "react";
import { marcarLeitura } from "@/app/(escola)/[slug]/responsavel/actions";

/** Marca o dia como lido quando o resumo abre (sem botão extra). */
export function MarcarLeitura({ slug, diaId }: { slug: string; diaId: string }) {
  useEffect(() => {
    void marcarLeitura(slug, diaId);
  }, [slug, diaId]);
  return null;
}
