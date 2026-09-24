import assert from "node:assert/strict";
import { test } from "node:test";
import { recordStockMovement, StockServiceError, normalizeStockMovement } from "../stock-service";

const actor = { usuarioId: "user-1", employeeId: "employee-1" };

test("normalizes an omitted batch to the single non-batch stock key", () => {
  const movement = normalizeStockMovement({ kind: "ENTRY", sourceType: "APPROVED_PURCHASE_RECEIPT", warehouseId: "warehouse-1", materialId: "material-1", quantity: 3, actor });
  assert.equal(movement.batchNumber, "");
  assert.equal(movement.quantity, 3);
});

test("allows signed adjustments but rejects signed entries and exits", () => {
  assert.equal(normalizeStockMovement({ kind: "ADJUSTMENT", warehouseId: "warehouse-1", materialId: "material-1", quantity: -2, actor }).quantity, -2);
  assert.throws(
    () => normalizeStockMovement({ kind: "EXIT", warehouseId: "warehouse-1", materialId: "material-1", quantity: -2, actor }),
    StockServiceError,
  );
});

test("rejects invalid stock quantities and costs before writing", () => {
  assert.throws(
    () => normalizeStockMovement({ kind: "ENTRY", warehouseId: "warehouse-1", materialId: "material-1", quantity: 0, actor }),
    StockServiceError,
  );
  assert.throws(
    () => normalizeStockMovement({ kind: "ENTRY", sourceType: "APPROVED_PURCHASE_RECEIPT", warehouseId: "warehouse-1", materialId: "material-1", quantity: 1, unitCost: -1, actor }),
    StockServiceError,
  );
});

test("allows a settlement only on stock exits", () => {
  assert.equal(normalizeStockMovement({ kind: "EXIT", warehouseId: "warehouse-1", materialId: "material-1", quantity: 1, settlementId: "settlement-1", actor }).settlementId, "settlement-1");
  assert.throws(
    () => normalizeStockMovement({ kind: "ENTRY", warehouseId: "warehouse-1", materialId: "material-1", quantity: 1, settlementId: "settlement-1", actor }),
    StockServiceError,
  );
});

test("records the stock row and audit evidence in one transaction", async () => {
  const movements: Array<Record<string, unknown>> = [];
  const transaction = {
    warehouse: { findFirst: async () => ({ id: "warehouse-1" }) },
    material: { findUnique: async () => ({ id: "material-1" }) },
    inventorySession: { findFirst: async () => null },
    materialStock: { upsert: async () => ({ id: "stock-1", unitCost: 12 }) },
    materialMovement: { create: async ({ data }: { data: Record<string, unknown> }) => { movements.push(data); return { id: "movement-1" }; } },
  };
  const database = {
    $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction),
  };

  await recordStockMovement(database as never, {
    kind: "ENTRY",
    sourceType: "APPROVED_PURCHASE_RECEIPT",
    warehouseId: "warehouse-1",
    materialId: "material-1",
    quantity: 3,
    unitCost: 12,
    reason: "Nota fiscal 123",
    actor,
  });

  assert.deepEqual(movements[0], {
    type: "Entrada",
    quantity: 3,
    unitValue: 12,
    reason: "Nota fiscal 123",
    warehouseId: "warehouse-1",
    materialId: "material-1",
    stockId: "stock-1",
    supplierId: null,
    departmentId: null,
    obrasServicoId: null,
    settlementId: null,
    inventorySessionId: null,
    materialRequestItemId: null,
    actorUsuarioId: "user-1",
    actorEmployeeId: "employee-1",
  });
});

test("persists an active settlement reference with a stock exit", async () => {
  const movements: Array<Record<string, unknown>> = [];
  const transaction = {
    warehouse: { findFirst: async () => ({ id: "warehouse-1" }) },
    material: { findUnique: async () => ({ id: "material-1" }) },
    settlement: { findFirst: async () => ({ id: "settlement-1" }) },
    inventorySession: { findFirst: async () => null },
    materialStock: {
      findUnique: async () => ({ id: "stock-1", unitCost: 12 }),
      updateMany: async () => ({ count: 1 }),
    },
    materialMovement: { create: async ({ data }: { data: Record<string, unknown> }) => { movements.push(data); return { id: "movement-1" }; } },
  };
  const database = { $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) };

  await recordStockMovement(database as never, {
    kind: "EXIT", warehouseId: "warehouse-1", materialId: "material-1", quantity: 1, settlementId: "settlement-1", actor,
  });

  assert.equal(movements[0].settlementId, "settlement-1");
});

test("blocks every regular stock movement while the warehouse inventory is locked", async () => {
  const transaction = {
    warehouse: { findFirst: async () => ({ id: "warehouse-1" }) },
    material: { findUnique: async () => ({ id: "material-1" }) },
    inventorySession: { findFirst: async () => ({ id: "inventory-1" }) },
  };
  const database = { $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) };

  for (const kind of ["ENTRY", "EXIT", "ADJUSTMENT"] as const) {
    await assert.rejects(
      recordStockMovement(database as never, { kind, ...(kind === "ENTRY" ? { sourceType: "APPROVED_PURCHASE_RECEIPT" as const } : {}), warehouseId: "warehouse-1", materialId: "material-1", quantity: 1, actor }),
      /Movimentações estão bloqueadas enquanto o inventário/,
    );
  }
});
