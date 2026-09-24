import assert from "node:assert/strict";
import test from "node:test";
import { aggregatePurchaseRequestItems, PurchaseProcessOriginError } from "../src/lib/compras/purchase-process-origins.ts";

test("CLC-030 aggregates matching request items while preserving every source quantity", () => {
  const items = aggregatePurchaseRequestItems([
    { id: "request-item-1", catalogItemId: "catalog-1", materialId: "material-1", customName: null, quantity: 2, estimatedUnitValue: 10 },
    { id: "request-item-2", catalogItemId: "catalog-1", materialId: "material-1", customName: null, quantity: 3, estimatedUnitValue: 10 },
    { id: "request-item-3", catalogItemId: "catalog-1", materialId: "material-1", customName: null, quantity: 1, estimatedUnitValue: 11 },
  ]);

  assert.deepEqual(items, [
    {
      catalogItemId: "catalog-1",
      materialId: "material-1",
      customName: null,
      quantity: 5,
      estimatedUnitValue: 10,
      origins: [
        { purchaseRequestItemId: "request-item-1", quantity: 2 },
        { purchaseRequestItemId: "request-item-2", quantity: 3 },
      ],
    },
    {
      catalogItemId: "catalog-1",
      materialId: "material-1",
      customName: null,
      quantity: 1,
      estimatedUnitValue: 11,
      origins: [{ purchaseRequestItemId: "request-item-3", quantity: 1 }],
    },
  ]);
});

test("CLC-030 rejects invalid source item quantities", () => {
  assert.throws(
    () => aggregatePurchaseRequestItems([{ id: "request-item-1", catalogItemId: null, materialId: null, customName: "Serviço", quantity: 0, estimatedUnitValue: 10 }]),
    PurchaseProcessOriginError,
  );
});
