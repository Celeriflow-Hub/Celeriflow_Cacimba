import assert from "node:assert/strict";
import test from "node:test";
import { Prisma } from "@prisma/client";
import {
  assertPurchaseRequestItemBudgetAllocations,
  normalizePurchaseRequestItemBudgetAllocations,
  PurchaseRequestBudgetError,
  totalPurchaseRequestBudgetAllocations,
} from "../src/lib/compras/purchase-request-budget.ts";

const item = { quantity: 3, estimatedUnitValue: 12.5 };

test("CLC-025 normalizes an item allocation only when quantity and value are fully distributed", () => {
  const allocations = normalizePurchaseRequestItemBudgetAllocations([
    { budgetAppropriationId: "appropriation-1", quantity: 1, value: 12.5 },
    { budgetAppropriationId: "appropriation-2", quantity: 2, value: 25 },
  ], item);

  assert.equal(allocations[0].valueDecimal.toString(), "12.5");
  assert.equal(totalPurchaseRequestBudgetAllocations([allocations]).toString(), "37.5");
  assert.doesNotThrow(() => assertPurchaseRequestItemBudgetAllocations(item, allocations));
});

test("CLC-025 rejects incomplete, duplicate, or invalid budget allocation distributions", () => {
  assert.throws(
    () => normalizePurchaseRequestItemBudgetAllocations([{ budgetAppropriationId: "appropriation-1", quantity: 2, value: 25 }], item),
    PurchaseRequestBudgetError,
  );
  assert.throws(
    () => normalizePurchaseRequestItemBudgetAllocations([
      { budgetAppropriationId: "appropriation-1", quantity: 1, value: 12.5 },
      { budgetAppropriationId: "appropriation-1", quantity: 2, value: 25 },
    ], item),
    PurchaseRequestBudgetError,
  );
  assert.throws(
    () => assertPurchaseRequestItemBudgetAllocations(item, [{
      budgetAppropriationId: "appropriation-1",
      quantity: 3,
      valueDecimal: new Prisma.Decimal("36.99"),
    }]),
    PurchaseRequestBudgetError,
  );
});
