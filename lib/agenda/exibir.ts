/** Texto curto de um valor registrado, igual em todo o app (lista, toast, resumo dos pais). */
import { formatarDuracao, minutosEntre } from "./hora.ts";
import { lerValor, unidadeDoCampo, type TipoCampo } from "./tipos.ts";

export function textoDoValor(tipo: TipoCampo, configuracao: unknown, valor: unknown): string {
  switch (tipo) {
    case "opcao": {
      const v = lerValor("opcao", {}, valor);
      return v?.opcao ?? "—";
    }
    case "sim_nao": {
      const v = lerValor("sim_nao", {}, valor);
      return v ? (v.sim ? "Sim" : "Não") : "—";
    }
    case "evento": {
      const v = lerValor("evento", {}, valor);
      return v ? [v.hora, v.opcao, v.obs].filter(Boolean).join(" · ") : "—";
    }
    case "intervalo": {
      const v = lerValor("intervalo", {}, valor);
      if (!v) return "—";
      return v.fim ? `${v.inicio}–${v.fim} (${formatarDuracao(minutosEntre(v.inicio, v.fim))})` : `desde ${v.inicio} · dormindo`;
    }
    case "quantidade": {
      const v = lerValor("quantidade", {}, valor);
      if (!v) return "—";
      const un = unidadeDoCampo(configuracao);
      const qtd = `${String(v.quantidade).replace(".", ",")}${un ? (un.startsWith("°") ? un : ` ${un}`) : ""}`;
      return v.hora ? `${qtd} às ${v.hora}` : qtd;
    }
    case "texto": {
      const v = lerValor("texto", {}, valor);
      return v?.texto ?? "—";
    }
    case "checklist": {
      const v = lerValor("checklist", {}, valor);
      if (!v) return "—";
      return [v.itens.join(", "), v.obs].filter(Boolean).join(" · ") || "Nada";
    }
  }
}
