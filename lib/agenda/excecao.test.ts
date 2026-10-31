import { test } from "node:test";
import assert from "node:assert/strict";
import { limitarDestaques, nivelExcecao } from "./excecao.ts";

const refeicao = { tipo: "opcao" as const, destaque: "atencao", opcoes: { opcoes: ["Comeu tudo", "Recusou"], destaque_opcoes: ["Recusou"] } };
const febre = { tipo: "quantidade" as const, destaque: "alerta", opcoes: { unidade: "°C", destaque_acima: 37.5 } };
const medicacao = { tipo: "evento" as const, destaque: "alerta", opcoes: {} };
const trazer = { tipo: "checklist" as const, destaque: "atencao", opcoes: {} };
const sono = { tipo: "intervalo" as const, destaque: null, opcoes: {} };

test("refeição: só as opções configuradas são exceção", () => {
  assert.equal(nivelExcecao(refeicao, { opcao: "Recusou" }), "atencao");
  assert.equal(nivelExcecao(refeicao, { opcao: "Comeu tudo" }), null);
});

test("temperatura: só acima do limite", () => {
  assert.equal(nivelExcecao(febre, { quantidade: 38.2, hora: "10:00" }), "alerta");
  assert.equal(nivelExcecao(febre, { quantidade: 36.5 }), null);
});

test("medicação sem condição: qualquer registro; campo sem destaque nunca", () => {
  assert.equal(nivelExcecao(medicacao, { hora: "10:00", obs: "dipirona" }), "alerta");
  assert.equal(nivelExcecao(sono, { inicio: "12:00", fim: "13:00" }), null);
});

test("trazer amanhã vazio não destaca", () => {
  assert.equal(nivelExcecao(trazer, { itens: [] }), null);
  assert.equal(nivelExcecao(trazer, { itens: ["Fralda"] }), "atencao");
});

test("no máximo 2 destaques, alerta primeiro", () => {
  const itens = [
    { id: "a", nivel: "atencao" as const, ordem: 1 },
    { id: "b", nivel: null, ordem: 2 },
    { id: "c", nivel: "alerta" as const, ordem: 3 },
    { id: "d", nivel: "atencao" as const, ordem: 4 },
  ];
  assert.deepEqual([...limitarDestaques(itens)].map((i) => i.id), ["c", "a"]);
});
