/**
 * Exceção = o que merece destaque para a família (UX.md §4, Von Restorff).
 * Decidido só pela configuração do campo (destaque + opcoes.destaque_opcoes /
 * opcoes.destaque_acima), nunca pela chave — regra 6 do CLAUDE.md.
 */
import { lerValor, type TipoCampo } from "./tipos.ts";

export type NivelDestaque = "atencao" | "alerta";
export type CampoComDestaque = { tipo: TipoCampo; opcoes: unknown; destaque: string | null };

export function nivelExcecao(campo: CampoComDestaque, valor: unknown): NivelDestaque | null {
  const nivel = campo.destaque === "alerta" || campo.destaque === "atencao" ? campo.destaque : null;
  if (!nivel) return null;
  const cfg = (campo.opcoes ?? {}) as { destaque_opcoes?: unknown; destaque_acima?: unknown };
  const lista = Array.isArray(cfg.destaque_opcoes) ? (cfg.destaque_opcoes as string[]) : null;
  const acima = typeof cfg.destaque_acima === "number" ? cfg.destaque_acima : null;

  switch (campo.tipo) {
    case "opcao": {
      const v = lerValor("opcao", {}, valor);
      return v && (!lista || lista.includes(v.opcao)) ? nivel : null;
    }
    case "evento": {
      const v = lerValor("evento", {}, valor);
      return v && (!lista || (v.opcao !== undefined && lista.includes(v.opcao))) ? nivel : null;
    }
    case "quantidade": {
      const v = lerValor("quantidade", {}, valor);
      return v && (acima === null || v.quantidade > acima) ? nivel : null;
    }
    case "checklist": {
      const v = lerValor("checklist", {}, valor);
      return v && v.itens.length > 0 ? nivel : null;
    }
    default:
      return valor ? nivel : null;
  }
}

/** UX.md: no máximo 1 ou 2 destaques por tela — alerta primeiro, depois a ordem dos campos. */
export function limitarDestaques<T extends { nivel: NivelDestaque | null; ordem: number }>(itens: T[], max = 2): Set<T> {
  const candidatos = itens
    .filter((i) => i.nivel)
    .sort((a, b) => (a.nivel === b.nivel ? a.ordem - b.ordem : a.nivel === "alerta" ? -1 : 1));
  return new Set(candidatos.slice(0, max));
}
