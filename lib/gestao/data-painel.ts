import { dataValida, hoje } from "@/lib/agenda/data";

/** Data do painel vinda da URL: válida e nunca no futuro; senão, hoje. */
export function dataDoPainel(bruta?: string) {
  const h = hoje();
  return dataValida(bruta) && bruta <= h ? bruta : h;
}
