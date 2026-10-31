import { test } from "node:test";
import assert from "node:assert/strict";
import { lerValor, OPCOES_POR_TIPO, schemaValor } from "./tipos.ts";

const refeicao = { opcoes: ["Comeu tudo", "Comeu bem", "Comeu pouco", "Recusou"] };

test("opcao: só aceita opções da lista", () => {
  assert.ok(schemaValor("opcao", refeicao).safeParse({ opcao: "Comeu tudo" }).success);
  assert.ok(!schemaValor("opcao", refeicao).safeParse({ opcao: "Inventado" }).success);
});

test("evento: hora tolerante", () => {
  const s = schemaValor("evento", { opcoes: ["Xixi", "Cocô"] });
  assert.deepEqual(s.parse({ hora: "14h30", opcao: "Xixi", obs: "  " }), { hora: "14:30", opcao: "Xixi", obs: undefined });
  assert.ok(!s.safeParse({ hora: "25:00", opcao: "Xixi" }).success);
});

test("intervalo: sono sem fim (ainda dormindo)", () => {
  assert.deepEqual(schemaValor("intervalo", {}).parse({ inicio: "12:10" }), { inicio: "12:10", fim: null });
  assert.deepEqual(schemaValor("intervalo", {}).parse({ inicio: "12h10", fim: "13h40" }), { inicio: "12:10", fim: "13:40" });
});

test("quantidade: aceita texto numérico e recusa negativo", () => {
  assert.deepEqual(schemaValor("quantidade", { unidade: "ml" }).parse({ quantidade: "180", hora: "9" }), { quantidade: 180, hora: "09:00" });
  assert.ok(!schemaValor("quantidade", { unidade: "ml" }).safeParse({ quantidade: -1 }).success);
});

test("texto e checklist", () => {
  assert.ok(!schemaValor("texto", {}).safeParse({ texto: "   " }).success);
  const trazer = { opcoes: ["Fralda", "Roupa extra"] };
  assert.ok(schemaValor("checklist", trazer).safeParse({ itens: ["Fralda"] }).success);
  assert.ok(!schemaValor("checklist", trazer).safeParse({ itens: ["Bicicleta"] }).success);
});

test("lerValor devolve null para dado fora do formato", () => {
  assert.equal(lerValor("sim_nao", {}, { sim: "talvez" }), null);
  assert.deepEqual(lerValor("sim_nao", {}, { sim: true }), { sim: true });
});

test("configuração: escolha única tem de 2 a 5 opções sem repetir", () => {
  assert.ok(!OPCOES_POR_TIPO.opcao.safeParse({ opcoes: ["Sim"] }).success);
  assert.ok(!OPCOES_POR_TIPO.opcao.safeParse({ opcoes: ["a", "b", "c", "d", "e", "f"] }).success);
  assert.ok(!OPCOES_POR_TIPO.opcao.safeParse({ opcoes: ["Bem", "bem"] }).success);
});
