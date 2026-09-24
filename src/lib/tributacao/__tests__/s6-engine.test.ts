import assert from "node:assert/strict";
import test from "node:test";
import { calculateDesifAssessment, calculatePackageMovement, calculateTrialBalance, canIssueDesifReceipt } from "../s6-engine";

test("apura o cenário obrigatório do ISS bancário", () => {
  const result = calculateDesifAssessment({ revenue: 10_000, deduction: 1_000, rate: 5, credit: 50 });
  assert.equal(result.taxableBase.toFixed(2), "9000.00");
  assert.equal(result.grossTax.toFixed(2), "450.00");
  assert.equal(result.taxDue.toFixed(2), "400.00");
});

test("confronta balancete de natureza credora", () => {
  const result = calculateTrialBalance({ openingBalance: 1_000, credits: 500, debits: 200, declaredClose: 1_300, nature: "CREDORA" });
  assert.equal(result.calculatedClose.toFixed(2), "1300.00");
  assert.equal(result.consistent, true);
});

test("calcula pacote sem somar a diferença novamente à receita COSIF", () => {
  const result = calculatePackageMovement({ accountHolders: 100, tariffAmount: 30, collectedRevenue: 2_800, rate: 5 });
  assert.equal(result.potentialRevenue.toFixed(2), "3000.00");
  assert.equal(result.difference.toFixed(2), "200.00");
  assert.equal(result.assessmentImpact.toFixed(2), "10.00");
});

test("só permite recibo após processamento", () => {
  assert.equal(canIssueDesifReceipt("VALIDADO", null), false);
  assert.equal(canIssueDesifReceipt("PROCESSADO", new Date()), true);
});
