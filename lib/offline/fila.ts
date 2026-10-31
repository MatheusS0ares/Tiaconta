"use client";

/**
 * Fila offline de operações da agenda (UX.md, Doherty: "falha de rede não
 * perde dado"). Cada operação vai para o IndexedDB antes de ser enviada e só
 * sai de lá quando o servidor confirma. Todas as operações são idempotentes
 * no banco (id/lote_id gerados aqui), então reenviar é seguro.
 */
import { criarClienteBrowser } from "@/lib/supabase/client";

type Base = { opId: string; seq: number; chave: string };

export type Operacao = Base &
  (
    | { tipo: "registrar"; id: string; criancaId: string; data: string; campoId: string; valor: unknown }
    | { tipo: "remover"; id: string }
    | { tipo: "lote"; loteId: string; turmaId: string; data: string; campoId: string; valor: unknown; exceto: string[] }
    | { tipo: "desfazerLote"; loteId: string }
    | { tipo: "falta"; criancaId: string; data: string; faltou: boolean }
    | { tipo: "finalizar"; criancaId: string; data: string }
    | { tipo: "finalizarTurma"; turmaId: string; data: string }
    | { tipo: "mural"; turmaId: string; data: string; texto: string }
  );

export type NovaOperacao = Operacao extends infer O ? (O extends Operacao ? Omit<O, "opId" | "seq"> : never) : never;

export type EstadoFila = { pendentes: Operacao[]; semRede: boolean };
export type Evento =
  | { tipo: "confirmada"; op: Operacao }
  | { tipo: "rejeitada"; op: Operacao; mensagem: string };

const BANCO = "tiaconta";
const LOJA = "fila";

let memoria: Operacao[] = [];
let carregada: Promise<void> | null = null;
let enviando: string | null = null;
let semRede = false;
let agendado: ReturnType<typeof setTimeout> | null = null;
const ouvintesEstado = new Set<(e: EstadoFila) => void>();
const ouvintesEvento = new Set<(e: Evento) => void>();

function abrir(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((ok) => {
    const req = indexedDB.open(BANCO, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(LOJA, { keyPath: "opId" });
    req.onsuccess = () => ok(req.result);
    req.onerror = () => ok(null); // modo privado etc.: segue só em memória
  });
}

async function persistir(acao: (loja: IDBObjectStore) => void) {
  const db = await abrir();
  if (!db) return;
  await new Promise<void>((ok) => {
    const tx = db.transaction(LOJA, "readwrite");
    acao(tx.objectStore(LOJA));
    tx.oncomplete = () => ok();
    tx.onerror = () => ok();
  });
  db.close();
}

function carregar() {
  carregada ??= (async () => {
    const db = await abrir();
    if (!db) return;
    const todas = await new Promise<Operacao[]>((ok) => {
      const req = db.transaction(LOJA).objectStore(LOJA).getAll();
      req.onsuccess = () => ok(req.result as Operacao[]);
      req.onerror = () => ok([]);
    });
    db.close();
    const ids = new Set(memoria.map((o) => o.opId));
    memoria = [...todas.filter((o) => !ids.has(o.opId)), ...memoria].sort((a, b) => a.seq - b.seq);
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => processar());
      window.addEventListener("focus", () => processar());
    }
  })();
  return carregada;
}

function notificar() {
  const estado = { pendentes: [...memoria], semRede };
  ouvintesEstado.forEach((f) => f(estado));
}

export function assinarEstado(f: (e: EstadoFila) => void) {
  ouvintesEstado.add(f);
  void carregar().then(() => {
    f({ pendentes: [...memoria], semRede });
    processar();
  });
  return () => void ouvintesEstado.delete(f);
}

export function assinarEventos(f: (e: Evento) => void) {
  ouvintesEvento.add(f);
  return () => void ouvintesEvento.delete(f);
}

export function novoId() {
  return crypto.randomUUID();
}

export async function adicionar(nova: NovaOperacao): Promise<Operacao> {
  await carregar();
  const op = { ...nova, opId: novoId(), seq: Date.now() + Math.random() } as Operacao;
  memoria.push(op);
  notificar();
  await persistir((l) => l.put(op));
  processar();
  return op;
}

/** Tira da fila uma operação que ainda não foi enviada. false = já foi (ou está indo). */
export async function cancelar(opId: string) {
  if (enviando === opId || !memoria.some((o) => o.opId === opId)) return false;
  memoria = memoria.filter((o) => o.opId !== opId);
  notificar();
  await persistir((l) => l.delete(opId));
  return true;
}

function eErroDeRede(mensagem: string) {
  return (typeof navigator !== "undefined" && !navigator.onLine) || /fetch|network|load failed|timeout/i.test(mensagem);
}

const MENSAGENS: Record<string, string> = {
  dia_finalizado: "o dia já foi finalizado",
  valor_invalido: "o valor não é válido para este campo",
  campo_invalido: "o campo foi desligado pela gestão",
  "42501": "você não tem permissão nesta turma",
};

async function executar(op: Operacao) {
  const sb = criarClienteBrowser();
  switch (op.tipo) {
    case "registrar":
      return sb.rpc("registrar", { p_id: op.id, p_crianca: op.criancaId, p_data: op.data, p_campo: op.campoId, p_valor: op.valor as never });
    case "remover":
      return sb.from("agenda_registros").delete().eq("id", op.id);
    case "lote":
      return sb.rpc("registrar_em_lote", {
        p_turma: op.turmaId,
        p_data: op.data,
        p_campo: op.campoId,
        p_valor: op.valor as never,
        p_exceto: op.exceto,
        p_lote: op.loteId,
      });
    case "desfazerLote":
      return sb.from("agenda_registros").delete().eq("lote_id", op.loteId);
    case "falta":
      return sb.rpc("definir_falta", { p_crianca: op.criancaId, p_data: op.data, p_faltou: op.faltou });
    case "finalizar":
      return sb.rpc("finalizar_dia", { p_crianca: op.criancaId, p_data: op.data });
    case "finalizarTurma":
      return sb.rpc("finalizar_dia_turma", { p_turma: op.turmaId, p_data: op.data });
    case "mural":
      return sb.rpc("salvar_mural", { p_turma: op.turmaId, p_data: op.data, p_texto: op.texto });
  }
}

/** Envia a fila em ordem, uma operação por vez. */
export function processar() {
  if (enviando || typeof window === "undefined") return;
  const op = memoria[0];
  if (!op) return;
  enviando = op.opId;
  void (async () => {
    let resultado: { error: { message: string; code?: string } | null };
    try {
      resultado = await executar(op);
    } catch (e) {
      resultado = { error: { message: e instanceof Error ? e.message : String(e) } };
    }
    enviando = null;
    const erro = resultado.error;

    if (erro && eErroDeRede(erro.message)) {
      semRede = true;
      notificar();
      if (agendado) clearTimeout(agendado);
      agendado = setTimeout(processar, 5000);
      return;
    }

    memoria = memoria.filter((o) => o.opId !== op.opId);
    semRede = false;
    await persistir((l) => l.delete(op.opId));
    notificar();
    if (erro) {
      const chave = Object.keys(MENSAGENS).find((k) => erro.message.includes(k) || erro.code === k);
      ouvintesEvento.forEach((f) => f({ tipo: "rejeitada", op, mensagem: chave ? MENSAGENS[chave]! : "o servidor recusou" }));
    } else {
      ouvintesEvento.forEach((f) => f({ tipo: "confirmada", op }));
    }
    processar();
  })();
}
