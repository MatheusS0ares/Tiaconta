import type { ComponentProps } from "react";

export function Cartao({ className = "", ...props }: ComponentProps<"section">) {
  return <section className={`rounded-tc border border-neutra bg-fundo p-4 ${className}`} {...props} />;
}
