/** Datas e horas sempre no fuso da escola (America/Sao_Paulo), nunca UTC do servidor. */
export const FUSO = "America/Sao_Paulo";

const partesData = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" });
const partesHora = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit", hour12: false });

/** "2026-10-31" no fuso da escola. */
export function hoje(agora = new Date()) {
  return partesData.format(agora);
}

/** "14:05" no fuso da escola. */
export function horaAgora(agora = new Date()) {
  return partesHora.format(agora);
}

/** Horário "HH:MM" de um timestamp ISO, no fuso da escola. */
export function horaDe(iso: string) {
  return partesHora.format(new Date(iso));
}

export function dataValida(d: string | undefined | null): d is string {
  return !!d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(new Date(d + "T12:00:00Z").getTime());
}

const longa = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
/** "sábado, 31 de outubro" (a data já está no calendário da escola). */
export function formatarDataLonga(data: string) {
  return longa.format(new Date(data + "T12:00:00Z"));
}

export function somarDias(data: string, dias: number) {
  const d = new Date(data + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
