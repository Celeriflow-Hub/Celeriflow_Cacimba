import assert from "node:assert/strict";
import test from "node:test";
import { calculateVaf, crossCheck, detectOmission, evaluateFormula, mergeEfdGia, participation } from "../s10-engine";

test("VAF cenário obrigatório A/B sem duplicar fontes (TRIB-S10)", () => {
  const a = calculateVaf({ saidaElegivel: 15000, entradaElegivel: 9000 });
  const b = calculateVaf({ saidaElegivel: 4000, entradaElegivel: 0 });
  assert.equal(String(a.vaf), "6000");
  assert.equal(String(b.vaf), "4000");
  assert.equal(String(participation(10000, 6000).participation), "60");
  assert.equal(String(participation(10000, 4000).participation), "40");
});

test("fórmula restrita avalia aritmética com precedência", () => {
  assert.equal(String(evaluateFormula("saida - entrada", { saida: 15000, entrada: 9000 })), "6000");
  assert.equal(String(evaluateFormula("saida * 2 + entrada", { saida: 5, entrada: 1 })), "11");
  assert.equal(String(evaluateFormula("(saida + entrada) / 2", { saida: 10, entrada: 20 })), "15");
  assert.equal(String(evaluateFormula("-saida + entrada", { saida: 5, entrada: 9 })), "4");
});

test("fórmula bloqueia injeção e identificadores livres (sem eval)", () => {
  assert.throws(() => evaluateFormula("process.exit()", { saida: 1 }));
  assert.throws(() => evaluateFormula("globalThis.constructor", {}));
  assert.throws(() => evaluateFormula("saida.constructor", { saida: 1 }));
  assert.throws(() => evaluateFormula("Math.max(saida, entrada)", { saida: 5, entrada: 9 }));
  assert.throws(() => evaluateFormula("saida - entrada; 1", { saida: 1, entrada: 0 }));
  assert.throws(() => evaluateFormula("desconhecida + 1", { saida: 1 }));
  assert.throws(() => evaluateFormula("saida / 0", { saida: 1 }));
});

test("EFD/GIA mescla sem somar fontes; cruzamento e omissos", () => {
  const merged = mergeEfdGia({ saida: 15000, entrada: 9000 }, { saida: 1, entrada: 1 }, "MERGED");
  assert.equal(String(merged.saida), "15000");
  assert.equal(crossCheck(100, 100).ok, true);
  assert.equal(crossCheck(100, 101).ok, false);
  assert.deepEqual(detectOmission(["a", "b"], ["a"]), ["b"]);
});
