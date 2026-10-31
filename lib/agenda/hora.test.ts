import { test } from "node:test";
import assert from "node:assert/strict";
import { formatarDuracao, minutosEntre, normalizarHora } from "./hora.ts";

test("normalizarHora aceita os formatos do UX.md (Postel)", () => {
  const casos: Record<string, string> = {
    "9": "09:00",
    "9h": "09:00",
    "09:00": "09:00",
    "9:30": "09:30",
    "9h30": "09:30",
    "0930": "09:30",
    " 14:05 ": "14:05",
    "23:59": "23:59",
    "0": "00:00",
    "9.30": "09:30",
  };
  for (const [entrada, saida] of Object.entries(casos)) assert.equal(normalizarHora(entrada), saida, entrada);
});

test("normalizarHora recusa o que não é hora", () => {
  for (const ruim of ["", "24", "25:00", "9:60", "abc", "9:5", "12345"]) assert.equal(normalizarHora(ruim), null, ruim);
});

test("duração do sono", () => {
  assert.equal(minutosEntre("12:10", "13:40"), 90);
  assert.equal(minutosEntre("23:30", "00:15"), 45);
  assert.equal(formatarDuracao(90), "1h30");
  assert.equal(formatarDuracao(45), "45min");
  assert.equal(formatarDuracao(120), "2h");
});
