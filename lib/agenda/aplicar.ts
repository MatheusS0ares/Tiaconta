/**
 * UI otimista: aplica operações ainda não refletidas pelo servidor sobre o
 * último estado carregado. Função pura (testada em aplicar.test.ts).
 */
import type { TurmaDia, RegistroDia } from "./modelo.ts";

export type OpAgenda =
  | { tipo: "registrar"; id: string; criancaId: string; campoId: string; valor: unknown }
  | { tipo: "remover"; id: string }
  | { tipo: "lote"; loteId: string; campoId: string; valor: unknown; exceto: string[] }
  | { tipo: "desfazerLote"; loteId: string }
  | { tipo: "falta"; criancaId: string; faltou: boolean }
  | { tipo: "finalizar"; criancaId: string }
  | { tipo: "finalizarTurma" }
  | { tipo: "mural"; texto: string };

export function aplicarOps(base: TurmaDia, ops: (OpAgenda & { pendente?: boolean })[], agora = new Date().toISOString()): TurmaDia {
  if (!ops.length) return base;
  const multiplo = new Map(base.campos.map((c) => [c.id, c.multiplo]));
  let registros: RegistroDia[] = [...base.registros];
  const dias = { ...base.dias };
  let mural = base.mural;
  const dia = (c: string) => (dias[c] ??= { status: "rascunho", faltou: false, finalizadoPor: null, finalizadoEm: null });
  const novo = (r: Omit<RegistroDia, "registradoPor" | "registradoEm">, pendente?: boolean): RegistroDia => ({
    ...r,
    registradoPor: base.usuarioId,
    registradoEm: agora,
    pendente,
  });

  for (const op of ops) {
    switch (op.tipo) {
      case "registrar": {
        const i = registros.findIndex(
          (r) => r.id === op.id || (!multiplo.get(op.campoId) && r.criancaId === op.criancaId && r.campoId === op.campoId),
        );
        if (i >= 0) registros[i] = { ...registros[i]!, valor: op.valor, loteId: null, pendente: op.pendente };
        else registros.push(novo({ id: op.id, criancaId: op.criancaId, campoId: op.campoId, valor: op.valor, loteId: null }, op.pendente));
        break;
      }
      case "remover":
        registros = registros.filter((r) => r.id !== op.id);
        break;
      case "lote": {
        if (registros.some((r) => r.loteId === op.loteId)) break; // servidor já refletiu
        for (const c of base.criancas) {
          if (op.exceto.includes(c.id)) continue;
          const d = dias[c.id];
          if (d?.faltou || d?.status === "finalizado") continue;
          if (!multiplo.get(op.campoId) && registros.some((r) => r.criancaId === c.id && r.campoId === op.campoId)) continue;
          registros.push(novo({ id: `${op.loteId}:${c.id}`, criancaId: c.id, campoId: op.campoId, valor: op.valor, loteId: op.loteId }, op.pendente));
        }
        break;
      }
      case "desfazerLote":
        registros = registros.filter((r) => r.loteId !== op.loteId);
        break;
      case "falta":
        dias[op.criancaId] = { ...dia(op.criancaId), faltou: op.faltou };
        break;
      case "finalizar":
        if (dia(op.criancaId).status !== "finalizado")
          dias[op.criancaId] = { ...dia(op.criancaId), status: "finalizado", finalizadoPor: base.usuarioId, finalizadoEm: agora };
        break;
      case "finalizarTurma":
        for (const c of base.criancas)
          if (dia(c.id).status !== "finalizado")
            dias[c.id] = { ...dia(c.id), status: "finalizado", finalizadoPor: base.usuarioId, finalizadoEm: agora };
        break;
      case "mural":
        mural = { texto: op.texto, autor: base.usuarioId, atualizadoEm: agora };
        break;
    }
  }
  return { ...base, registros, dias, mural };
}
