"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CloudOff } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { aplicarOps, type OpAgenda } from "@/lib/agenda/aplicar";
import { textoDoValor } from "@/lib/agenda/exibir";
import type { CampoDia, TurmaDia } from "@/lib/agenda/modelo";
import { adicionar, assinarEstado, assinarEventos, cancelar, novoId, type NovaOperacao, type Operacao } from "@/lib/offline/fila";

type Acoes = {
  registrar: (criancaId: string, campo: CampoDia, valor: unknown, idExistente?: string) => void;
  remover: (registroId: string) => void;
  lote: (campo: CampoDia, valor: unknown, exceto: string[]) => number;
  falta: (criancaId: string, faltou: boolean) => void;
  finalizar: (criancaId: string) => void;
  finalizarTurma: () => void;
  salvarMural: (texto: string) => void;
};

type Ctx = { estado: TurmaDia; acoes: Acoes; pendentes: number; semRede: boolean };
const AgendaCtx = createContext<Ctx | null>(null);

export function useAgenda() {
  const c = useContext(AgendaCtx);
  if (!c) throw new Error("useAgenda fora do AgendaProvider");
  return c;
}

/** Converte a operação da fila na operação de estado (sem os campos de transporte). */
function paraOpAgenda(op: Operacao): OpAgenda {
  switch (op.tipo) {
    case "registrar":
      return { tipo: "registrar", id: op.id, criancaId: op.criancaId, campoId: op.campoId, valor: op.valor };
    case "remover":
      return { tipo: "remover", id: op.id };
    case "lote":
      return { tipo: "lote", loteId: op.loteId, campoId: op.campoId, valor: op.valor, exceto: op.exceto };
    case "desfazerLote":
      return { tipo: "desfazerLote", loteId: op.loteId };
    case "falta":
      return { tipo: "falta", criancaId: op.criancaId, faltou: op.faltou };
    case "finalizar":
      return { tipo: "finalizar", criancaId: op.criancaId };
    case "finalizarTurma":
      return { tipo: "finalizarTurma" };
    case "mural":
      return { tipo: "mural", texto: op.texto };
  }
}

/**
 * Estado do dia da turma no cliente: dados do servidor + operações na fila
 * (UI otimista). Fica no layout da turma, então lista, criança, lote e mural
 * compartilham o mesmo estado.
 */
export function AgendaProvider({ dados, children }: { dados: TurmaDia; children: ReactNode }) {
  const router = useRouter();
  const { mostrar } = useToast();
  const chave = `${dados.turma.id}:${dados.data}`;
  const [fila, setFila] = useState<Operacao[]>([]);
  const [semRede, setSemRede] = useState(false);
  const [confirmadas, setConfirmadas] = useState<Operacao[]>([]);
  const refresh = useRef<ReturnType<typeof setTimeout> | null>(null);

  // nova carga do servidor: as confirmadas já estão nela
  useEffect(() => setConfirmadas([]), [dados.versao]);

  useEffect(
    () =>
      assinarEstado((e) => {
        setFila(e.pendentes.filter((o) => o.chave === chave));
        setSemRede(e.semRede);
      }),
    [chave],
  );

  useEffect(() => {
    const atualizar = () => {
      if (refresh.current) clearTimeout(refresh.current);
      refresh.current = setTimeout(() => router.refresh(), 700);
    };
    return assinarEventos((e) => {
      if (e.op.chave !== chave) return;
      if (e.tipo === "confirmada") setConfirmadas((c) => [...c, e.op]);
      else mostrar({ tipo: "erro", texto: `Não foi possível salvar: ${e.mensagem}.` });
      atualizar();
    });
  }, [chave, router, mostrar]);

  const estado = useMemo(
    () =>
      aplicarOps(dados, [
        ...confirmadas.map(paraOpAgenda),
        ...fila.map((o) => ({ ...paraOpAgenda(o), pendente: true })),
      ]),
    [dados, confirmadas, fila],
  );
  const estadoRef = useRef(estado);
  estadoRef.current = estado;

  const enfileirar = useCallback((op: NovaOperacao) => adicionar(op), []);

  const acoes = useMemo<Acoes>(() => {
    const base = { chave, data: dados.data };
    const nome = (id: string) => estadoRef.current.criancas.find((c) => c.id === id)?.nome.split(" ")[0] ?? "";

    const registrar: Acoes["registrar"] = (criancaId, campo, valor, idExistente) => {
      const atual = estadoRef.current.registros.find(
        (r) => r.id === idExistente || (!campo.multiplo && r.criancaId === criancaId && r.campoId === campo.id),
      );
      const id = atual?.id ?? novoId();
      const anterior = atual?.valor;
      const promessa = enfileirar({ ...base, tipo: "registrar", id, criancaId, campoId: campo.id, valor });
      mostrar({
        tipo: "sucesso",
        texto: `${nome(criancaId)} · ${campo.rotulo}: ${textoDoValor(campo.tipo, campo.opcoes, valor)}`,
        desfazer: async () => {
          const op = await promessa;
          if (await cancelar(op.opId)) return;
          if (atual) enfileirar({ ...base, tipo: "registrar", id, criancaId, campoId: campo.id, valor: anterior });
          else enfileirar({ ...base, tipo: "remover", id });
        },
      });
    };

    return {
      registrar,
      remover: (registroId) => {
        const r = estadoRef.current.registros.find((x) => x.id === registroId);
        if (!r) return;
        const promessa = enfileirar({ ...base, tipo: "remover", id: registroId });
        mostrar({
          tipo: "sucesso",
          texto: "Registro apagado",
          desfazer: async () => {
            const op = await promessa;
            if (await cancelar(op.opId)) return;
            enfileirar({ ...base, tipo: "registrar", id: r.id, criancaId: r.criancaId, campoId: r.campoId, valor: r.valor });
          },
        });
      },
      lote: (campo, valor, exceto) => {
        const loteId = novoId();
        const antes = estadoRef.current.registros.length;
        const previsto = aplicarOps(estadoRef.current, [{ tipo: "lote", loteId, campoId: campo.id, valor, exceto }]).registros.length - antes;
        const promessa = enfileirar({ ...base, tipo: "lote", loteId, turmaId: dados.turma.id, campoId: campo.id, valor, exceto });
        mostrar({
          tipo: "sucesso",
          texto: `${campo.rotulo}: ${textoDoValor(campo.tipo, campo.opcoes, valor)} · ${previsto} ${previsto === 1 ? "criança" : "crianças"}`,
          desfazer: async () => {
            const op = await promessa;
            if (await cancelar(op.opId)) return;
            enfileirar({ ...base, tipo: "desfazerLote", loteId });
          },
        });
        return previsto;
      },
      falta: (criancaId, faltou) => {
        const promessa = enfileirar({ ...base, tipo: "falta", criancaId, faltou });
        mostrar({
          tipo: "sucesso",
          texto: faltou ? `${nome(criancaId)}: falta marcada` : `${nome(criancaId)}: presença`,
          desfazer: async () => {
            const op = await promessa;
            if (await cancelar(op.opId)) return;
            enfileirar({ ...base, tipo: "falta", criancaId, faltou: !faltou });
          },
        });
      },
      finalizar: (criancaId) => {
        enfileirar({ ...base, tipo: "finalizar", criancaId });
        mostrar({ tipo: "sucesso", texto: `Dia de ${nome(criancaId)} finalizado` });
      },
      finalizarTurma: () => {
        enfileirar({ ...base, tipo: "finalizarTurma", turmaId: dados.turma.id });
        mostrar({ tipo: "sucesso", texto: `Dia da turma ${dados.turma.nome} finalizado` });
      },
      salvarMural: (texto) => {
        enfileirar({ ...base, tipo: "mural", turmaId: dados.turma.id, texto });
        mostrar({ tipo: "sucesso", texto: "Mural salvo" });
      },
    };
  }, [chave, dados.data, dados.turma.id, dados.turma.nome, enfileirar, mostrar]);

  return (
    <AgendaCtx.Provider value={{ estado, acoes, pendentes: fila.length, semRede }}>
      {fila.length > 0 && semRede ? (
        <div role="status" className="flex items-center gap-2 bg-superficie px-4 py-2 text-sm font-semibold text-atencao">
          <CloudOff className="size-4 shrink-0" aria-hidden />
          {fila.length} {fila.length === 1 ? "registro pendente" : "registros pendentes"} de envio. Vamos tentar de novo sozinhos.
        </div>
      ) : null}
      {children}
    </AgendaCtx.Provider>
  );
}
