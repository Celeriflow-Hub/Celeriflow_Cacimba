import assert from "node:assert/strict";
import test from "node:test";
import { normalizePurchaseItems, PurchaseItemInputError } from "../src/app/app-domain/compras/processos/purchase-item-input.ts";

test("purchase item normalization calculates totals from validated values and preserves zero", () => {
  const result = normalizePurchaseItems([
    { id: "process-item-1", catalogItemId: "catalog-item-1", customName: "ignored", quantity: 2, estimatedUnitValue: 0 },
    { catalogItemId: "custom", customName: "Servico especializado", quantity: 3, estimatedUnitValue: 12.5 },
  ]);

  assert.deepEqual(result.items, [
    { id: "process-item-1", catalogItemId: "catalog-item-1", customName: null, quantity: 2, estimatedUnitValue: 0 },
    { catalogItemId: null, customName: "Servico especializado", quantity: 3, estimatedUnitValue: 12.5 },
  ]);
  assert.equal(result.estimatedValue, 37.5);
});

test("purchase item normalization rejects invalid quantities and unit values", () => {
  assert.throws(
    () => normalizePurchaseItems([{ catalogItemId: "catalog-item-1", customName: "", quantity: 0, estimatedUnitValue: 10 }]),
    PurchaseItemInputError,
  );
  assert.throws(
    () => normalizePurchaseItems([{ catalogItemId: "catalog-item-1", customName: "", quantity: 1, estimatedUnitValue: -0.01 }]),
    PurchaseItemInputError,
  );
  assert.throws(
    () => normalizePurchaseItems([{ catalogItemId: "custom", customName: "  ", quantity: 1, estimatedUnitValue: 10 }]),
    PurchaseItemInputError,
  );
});
