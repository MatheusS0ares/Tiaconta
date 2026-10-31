"use client";

import { useLinkStatus } from "next/link";
import { ChevronRight, LoaderCircle } from "lucide-react";

/**
 * Seta do fim de uma linha clicável. Enquanto a próxima tela carrega, vira um
 * indicador girando (UX.md, Doherty: resposta visual em < 400ms). Substitui o
 * skeleton de rota (loading.tsx), que travava navegações no Next 15.5.
 * Precisa estar dentro de um <Link>.
 */
export function SetaLink({ className = "size-5 text-texto-2" }: { className?: string }) {
  const { pending } = useLinkStatus();
  return pending ? (
    <LoaderCircle className={`${className} animate-spin`} aria-label="Carregando" />
  ) : (
    <ChevronRight className={className} aria-hidden />
  );
}
