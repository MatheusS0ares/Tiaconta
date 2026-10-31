import Link from "next/link";
import type { ComponentProps } from "react";

type Variante = "primaria" | "marca" | "secundaria" | "perigo" | "texto";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-tc px-5 text-base font-bold " +
  "transition-[opacity,transform] duration-150 active:scale-[0.98] disabled:opacity-60 " +
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-texto";

const variantes: Record<Variante, string> = {
  primaria: "bg-primaria text-primaria-texto",
  marca: "bg-marinho text-branco", // telas da plataforma (login), fora do tenant
  secundaria: "border-2 border-neutra bg-fundo text-texto",
  perigo: "border-2 border-alerta bg-fundo text-alerta",
  texto: "text-texto underline underline-offset-4",
};

export function classesBotao(variante: Variante = "primaria", larguraTotal = true, extra = "") {
  return `${base} ${variantes[variante]} ${larguraTotal ? "w-full" : ""} ${extra}`;
}

type BotaoProps = ComponentProps<"button"> & { variante?: Variante; larguraTotal?: boolean };

export function Botao({ variante, larguraTotal, className = "", type = "button", ...props }: BotaoProps) {
  return <button type={type} className={classesBotao(variante, larguraTotal, className)} {...props} />;
}

type BotaoLinkProps = ComponentProps<typeof Link> & { variante?: Variante; larguraTotal?: boolean };

export function BotaoLink({ variante, larguraTotal, className = "", ...props }: BotaoLinkProps) {
  return <Link className={classesBotao(variante, larguraTotal, className)} {...props} />;
}
