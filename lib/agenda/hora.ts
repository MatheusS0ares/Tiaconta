/**
 * Horários (UX.md, Postel): aceita "9", "9h", "09:00", "9:30", "9h30", "0930"
 * e devolve sempre "HH:MM". Retorna null se não der para entender.
 */
export function normalizarHora(entrada: string): string | null {
  const t = entrada.trim().toLowerCase().replace(/\s+/g, "");
  if (!t) return null;
  let h: number;
  let m = 0;
  let r: RegExpMatchArray | null;
  if ((r = t.match(/^(\d{1,2})(?:h|:)?$/))) {
    h = Number(r[1]);
  } else if ((r = t.match(/^(\d{1,2})[:h.](\d{2})(?:min|m)?$/))) {
    h = Number(r[1]);
    m = Number(r[2]);
  } else if ((r = t.match(/^(\d{1,2})(\d{2})$/))) {
    h = Number(r[1]);
    m = Number(r[2]);
  } else {
    return null;
  }
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Minutos entre dois "HH:MM" (atravessa a meia-noite se fim < início). */
export function minutosEntre(inicio: string, fim: string) {
  const [hi, mi] = inicio.split(":").map(Number) as [number, number];
  const [hf, mf] = fim.split(":").map(Number) as [number, number];
  let d = hf * 60 + mf - (hi * 60 + mi);
  if (d < 0) d += 24 * 60;
  return d;
}

/** "1h30", "45min", "2h". */
export function formatarDuracao(minutos: number) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
