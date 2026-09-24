import assert from "node:assert/strict";
import test from "node:test";
import { allocateInstallmentPayment, calculateBenefit, executeDeterministicDraw, splitInstallmentAmount } from "../s8-engine";

test("divide R$ 1.000 em 333,33, 333,33 e 333,34", () => {
  assert.deepEqual(splitInstallmentAmount(1000, 3).map(String), ["333.33", "333.33", "333.34"]);
});

test("aloca pagamento de R$ 400 nas cotas mais antigas sem perder centavos", () => {
  const result = allocateInstallmentPayment([{ quotaNumber: 1, balance: 333.33 }, { quotaNumber: 2, balance: 333.33 }, { quotaNumber: 3, balance: 333.34 }], 400);
  assert.deepEqual(result.allocations.map((row) => [String(row.allocated), String(row.balanceAfter), row.status]), [["333.33", "0", "QUITADA"], ["66.67", "266.66", "ABERTA"], ["0", "333.34", "ABERTA"]]);
  assert.equal(String(result.totalBalance), "600");
});

test("aplica benefício sem produzir valor negativo", () => {
  const result = calculateBenefit({ amount: 1000, type: "REDUCAO", value: 15, valueMode: "PERCENT" });
  assert.equal(String(result.reduction), "150"); assert.equal(String(result.finalAmount), "850");
});

test("sorteio técnico é repetível", () => {
  const coupons = [{ id: "a", couponNumber: "0002", sourceDocumentId: "g2" }, { id: "b", couponNumber: "0001", sourceDocumentId: "g1" }];
  assert.deepEqual(executeDeterministicDraw(coupons, "semente-controlada", 1), executeDeterministicDraw([...coupons].reverse(), "semente-controlada", 1));
});
