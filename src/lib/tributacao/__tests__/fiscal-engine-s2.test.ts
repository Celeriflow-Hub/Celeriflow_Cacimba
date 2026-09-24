import assert from "node:assert/strict";
import test from "node:test";
import { calculateAccountBalance, calculateSimpleAccruals, evaluateFiscalRule } from "../fiscal-engine";

test("calcula o cenário obrigatório de IPTU e a revisão de cem reais", () => {
  const rule = { formula: "PERCENTUAL_BASE" as const, rate: 1, version: 1, reference: "IPTU anual" };
  const original = evaluateFiscalRule({ taxableBase: 100_000, configuration: rule });
  const reviewed = evaluateFiscalRule({ taxableBase: 110_000, configuration: rule });
  assert.equal(original.principal.toString(), "1000");
  assert.equal(reviewed.principal.toString(), "1100");
  assert.equal(reviewed.principal.minus(original.principal).toString(), "100");
});

test("mantém o saldo até a confirmação e ignora repetição do mesmo retorno", () => {
  const before = calculateAccountBalance({ constituted: 1_000 });
  const after = calculateAccountBalance({ constituted: 1_000, payments: [{ idempotencyKey: "RET-1", amount: 400 }] });
  const retried = calculateAccountBalance({ constituted: 1_000, payments: [{ idempotencyKey: "RET-1", amount: 400 }, { idempotencyKey: "RET-1", amount: 400 }] });
  assert.equal(before.balance.toString(), "1000");
  assert.equal(after.balance.toString(), "600");
  assert.equal(retried.balance.toString(), "600");
});

test("aplica juros simples sem capitalização", () => {
  const result = calculateSimpleAccruals({ principal: 1_000, monthlyInterestRate: 1, monthsLate: 2 });
  assert.equal(result.interest.toString(), "20");
  assert.equal(result.total.toString(), "1020");
});
