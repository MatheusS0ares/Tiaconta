import type { Papel } from "@/lib/auth/papeis";
import { urlDoSite } from "@/lib/navegacao";

export const PARENTESCOS = ["Mãe", "Pai", "Avó ou avô", "Outro"] as const;

export function linkDoConvite(token: string) {
  return `${urlDoSite()}/convite/${token}`;
}

/** Texto pronto para o WhatsApp (tom de voz: docs/MARCA.md). */
export function mensagemDoConvite(o: {
  escola: string;
  papel: Papel;
  crianca?: string | null;
  turma?: string | null;
  link: string;
}) {
  if (o.papel === "responsavel") {
    return `Olá! ${o.escola} convidou você para acompanhar o dia de ${o.crianca ?? "seu filho"} na escola pelo TiaConta. Toque no link para entrar: ${o.link}`;
  }
  const turma = o.turma ? ` da turma ${o.turma}` : "";
  return `Olá! ${o.escola} convidou você para registrar a agenda${turma} no TiaConta. Toque no link para entrar: ${o.link}`;
}

export function linkWhatsApp(mensagem: string) {
  return `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
}

const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
export function formatarValidade(iso: string) {
  return dataCurta.format(new Date(iso));
}
