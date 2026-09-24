import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ProcurementFinanceBridgeError,
  buildExpenseAuthorizationPlan,
  buildProcurementFinanceIdempotencyKey,
  isContractSupplyAuthorizationEligible,
  isInstrumentMeasurementLiquidationAuthorizationEligible,
  isPurchaseReceiptLiquidationAuthorizationEligible,
} from "../src/lib/compras/procurement-finance-bridge";

test("derives one AE value per appropriation without duplicating a shared origin", () => {
  const plan = buildExpenseAuthorizationPlan([
    {
      sourceItemId: "request-item-1",
      originId: "process-origin-1",
      sourceQuantity: 10,
      originQuantity: 10,
      budgetAppropriationId: "appropriation-a",
      valueDecimal: "60.00",
    },
    {
      sourceItemId: "request-item-1",
      originId: "process-origin-1",
      sourceQuantity: 10,
      originQuantity: 10,
      budgetAppropriationId: "appropriation-b",
      valueDecimal: "40.00",
    },
  ], "100.00");

  assert.deepEqual(plan.map((item) => [item.appropriationId, item.valueDecimal.toFixed(2)]), [
    ["appropriation-a", "60.00"],
    ["appropriation-b", "40.00"],
  ]);
});

test("rejects an AE plan that consumes more than the source item", () => {
  assert.throws(
    () => buildExpenseAuthorizationPlan([
      {
        sourceItemId: "request-item-1",
        originId: "process-origin-1",
        sourceQuantity: 10,
        originQuantity: 6,
        budgetAppropriationId: "appropriation-a",
        valueDecimal: "60.00",
      },
      {
        sourceItemId: "request-item-1",
        originId: "process-origin-2",
        sourceQuantity: 10,
        originQuantity: 5,
        budgetAppropriationId: "appropriation-a",
        valueDecimal: "50.00",
      },
    ], "110.00"),
    ProcurementFinanceBridgeError,
  );
});

test("does not infer a partial split across multiple appropriations", () => {
  assert.throws(
    () => buildExpenseAuthorizationPlan([
      {
        sourceItemId: "request-item-1",
        originId: "process-origin-1",
        sourceQuantity: 10,
        originQuantity: 6,
        budgetAppropriationId: "appropriation-a",
        valueDecimal: "60.00",
      },
      {
        sourceItemId: "request-item-1",
        originId: "process-origin-1",
        sourceQuantity: 10,
        originQuantity: 6,
        budgetAppropriationId: "appropriation-b",
        valueDecimal: "40.00",
      },
    ], "60.00"),
    /Não é seguro ratear parcialmente/,
  );
});

test("only derives AF and AL from eligible source facts", () => {
  const start = new Date("2026-01-01T12:00:00.000Z");
  const end = new Date("2026-12-31T12:00:00.000Z");

  assert.equal(isContractSupplyAuthorizationEligible("Vigente", start, end, new Date("2026-06-01T12:00:00.000Z")), true);
  assert.equal(isContractSupplyAuthorizationEligible("Minuta", start, end, new Date("2026-06-01T12:00:00.000Z")), false);
  assert.equal(isContractSupplyAuthorizationEligible("Vigente", start, end, new Date("2027-01-01T12:00:00.000Z")), false);
  assert.equal(isPurchaseReceiptLiquidationAuthorizationEligible("APPROVED"), true);
  assert.equal(isPurchaseReceiptLiquidationAuthorizationEligible("CANCELLED"), false);
  assert.equal(isInstrumentMeasurementLiquidationAuthorizationEligible("Atestada"), true);
  assert.equal(isInstrumentMeasurementLiquidationAuthorizationEligible("Em análise"), false);
});

test("uses deterministic idempotency keys for source events", () => {
  const first = buildProcurementFinanceIdempotencyKey("AE", "CONTRACT", "contract-1", "appropriation-1");
  const second = buildProcurementFinanceIdempotencyKey("AE", "CONTRACT", "contract-1", "appropriation-1");
  const other = buildProcurementFinanceIdempotencyKey("AE", "CONTRACT", "contract-1", "appropriation-2");

  assert.equal(first, second);
  assert.notEqual(first, other);
  assert.throws(() => buildProcurementFinanceIdempotencyKey("AE", "CONTRACT", ""), ProcurementFinanceBridgeError);
});
