import { test } from "node:test";
import assert from "node:assert/strict";
import { aplicarOps } from "./aplicar.ts";
import { progresso, statusDa, type TurmaDia } from "./modelo.ts";

const base = (): TurmaDia => ({
  turma: { id: "t", nome: "Berçário", faixa: "bercario" },
  data: "2026-10-31",
  usuarioId: "prof",
  eGestor: false,
  criancas: ["a", "b", "c"].map((id) => ({ id, nome: id, fotoUrl: null, restricoes: null, saude: null })),
  campos: [
    { id: "almoco", rotulo: "Almoço", tipo: "opcao", opcoes: {}, multiplo: false },
    { id: "fralda", rotulo: "Fralda", tipo: "evento", opcoes: {}, multiplo: true },
  ],
  dias: {},
  registros: [],
  mural: { texto: "", autor: null, atualizadoEm: null },
  nomes: {},
  versao: 1,
});

test("lote preenche todos, respeitando exceções e faltas", () => {
  const b = base();
  b.dias.c = { status: "rascunho", faltou: true, finalizadoPor: null, finalizadoEm: null };
  const e = aplicarOps(b, [{ tipo: "lote", loteId: "L", campoId: "almoco", valor: { opcao: "Comeu tudo" }, exceto: ["b"] }]);
  assert.deepEqual(e.registros.map((r) => r.criancaId), ["a"]);
});

test("exceção em campo de valor único substitui; em múltiplo acumula", () => {
  let e = aplicarOps(base(), [
    { tipo: "lote", loteId: "L", campoId: "almoco", valor: { opcao: "Comeu tudo" }, exceto: [] },
    { tipo: "registrar", id: "x", criancaId: "a", campoId: "almoco", valor: { opcao: "Recusou" } },
  ]);
  assert.equal(e.registros.filter((r) => r.criancaId === "a").length, 1);
  assert.deepEqual(e.registros.find((r) => r.criancaId === "a")!.valor, { opcao: "Recusou" });
  e = aplicarOps(e, [
    { tipo: "registrar", id: "f1", criancaId: "a", campoId: "fralda", valor: { hora: "09:00" } },
    { tipo: "registrar", id: "f2", criancaId: "a", campoId: "fralda", valor: { hora: "11:00" } },
  ]);
  assert.equal(e.registros.filter((r) => r.campoId === "fralda").length, 2);
});

test("lote já refletido pelo servidor não duplica", () => {
  const b = base();
  b.registros.push({ id: "srv", criancaId: "a", campoId: "almoco", valor: {}, registradoPor: "prof", registradoEm: "", loteId: "L" });
  const e = aplicarOps(b, [{ tipo: "lote", loteId: "L", campoId: "almoco", valor: {}, exceto: [] }]);
  assert.equal(e.registros.length, 1);
});

test("desfazer lote e remover", () => {
  const e = aplicarOps(base(), [
    { tipo: "lote", loteId: "L", campoId: "almoco", valor: {}, exceto: [] },
    { tipo: "desfazerLote", loteId: "L" },
  ]);
  assert.equal(e.registros.length, 0);
});

test("status e progresso (completa = finalizado ou falta)", () => {
  const e = aplicarOps(base(), [
    { tipo: "registrar", id: "x", criancaId: "a", campoId: "almoco", valor: {} },
    { tipo: "falta", criancaId: "b", faltou: true },
    { tipo: "finalizar", criancaId: "a" },
  ]);
  assert.equal(statusDa(e, "a"), "finalizado");
  assert.equal(statusDa(e, "b"), "faltou");
  assert.equal(statusDa(e, "c"), "pendente");
  const p = progresso(e);
  assert.equal(p.completas, 2);
  assert.deepEqual(p.pendentes.map((c) => c.id), ["c"]);
});
