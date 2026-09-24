import assert from "node:assert/strict";
import { test } from "node:test";
import { approvePurchaseReceipt, ProcurementLifecycleError } from "../src/lib/compras/procurement-lifecycle";
import { normalizeStockMovement, StockServiceError } from "../src/lib/patrimonio/stock-service";

const actor = { usuarioId: "user-1", employeeId: "employee-1" };

test("C5 rejects manual stock entries before any database operation", () => {
  assert.throws(
    () => normalizeStockMovement({ kind: "ENTRY", warehouseId: "warehouse-1", materialId: "material-1", quantity: 1, actor }),
    StockServiceError,
  );
  assert.equal(
    normalizeStockMovement({ kind: "ENTRY", sourceType: "APPROVED_PURCHASE_RECEIPT", warehouseId: "warehouse-1", materialId: "material-1", quantity: 1, actor }).sourceType,
    "APPROVED_PURCHASE_RECEIPT",
  );
});

test("C5 rejects a receipt without items before any database operation", async () => {
  await assert.rejects(
    approvePurchaseReceipt({} as never, actor, {
      number: "REC-1",
      receivedAt: new Date("2026-08-17T12:00:00.000Z"),
      contractId: "contract-1",
      documentId: "document-1",
      receiverId: "employee-2",
      attesterId: "employee-3",
      idempotencyKey: "receipt-1",
      items: [],
    }),
    ProcurementLifecycleError,
  );
});

test("C5 requires separate receiver and attester before any database operation", async () => {
  await assert.rejects(
    approvePurchaseReceipt({} as never, actor, {
      number: "REC-1",
      receivedAt: new Date("2026-08-17T12:00:00.000Z"),
      contractId: "contract-1",
      documentId: "document-1",
      receiverId: "employee-2",
      attesterId: "employee-2",
      idempotencyKey: "receipt-2",
      items: [{ purchaseProcessItemId: "process-item-1", materialId: "material-1", warehouseId: "warehouse-1", quantity: 1, unitCost: 10 }],
    }),
    ProcurementLifecycleError,
  );
});

test("C5 rejects a receipt line when its material differs from the approved process item", async () => {
  let receiptCreated = false;
  const transaction = {
    purchaseReceipt: {
      findUnique: async () => null,
      create: async () => {
        receiptCreated = true;
        return { id: "receipt-1" };
      },
    },
    contract: {
      findUnique: async () => ({
        id: "contract-1",
        status: "Vigente",
        startDate: new Date("2026-01-01T12:00:00.000Z"),
        endDate: new Date("2026-12-31T12:00:00.000Z"),
        supplierId: "supplier-1",
        processId: "process-1",
        process: { purchaseRequest: { requesterId: "employee-requester", status: "Aprovada" } },
      }),
    },
    document: { findUnique: async () => ({ id: "document-1", status: "Válido" }) },
    employee: { findUnique: async () => ({ id: "employee-2", isActive: true }) },
    purchaseProcessItem: { findMany: async () => [{ id: "process-item-1", quantity: 1, materialId: "material-approved" }] },
    purchaseReceiptItem: { findMany: async () => [] },
  };
  const database = { $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) };

  await assert.rejects(
    approvePurchaseReceipt(database as never, actor, {
      number: "REC-1",
      receivedAt: new Date("2026-08-17T12:00:00.000Z"),
      contractId: "contract-1",
      documentId: "document-1",
      receiverId: "employee-2",
      attesterId: "employee-3",
      idempotencyKey: "receipt-material-mismatch",
      items: [{ purchaseProcessItemId: "process-item-1", materialId: "material-other", warehouseId: "warehouse-1", quantity: 1, unitCost: 10 }],
    }),
    /deve corresponder ao item de material/,
  );
  assert.equal(receiptCreated, false);
});
