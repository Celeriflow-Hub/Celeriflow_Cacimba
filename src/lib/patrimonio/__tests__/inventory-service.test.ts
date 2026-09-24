import assert from "node:assert/strict";
import { test } from "node:test";
import { closeApprovedInventory } from "../inventory-service";

test("approved inventory closure records the adjustment and releases the movement lock", async () => {
  const movements: Array<Record<string, unknown>> = [];
  const itemUpdates: Array<Record<string, unknown>> = [];
  let closedData: Record<string, unknown> | undefined;
  const transaction = {
    inventorySession: {
      findUnique: async () => ({
        id: "inventory-1",
        createdByUsuarioId: "creator-1",
        status: "PENDING_APPROVAL",
        items: [{
          id: "item-1",
          expectedQuantity: 5,
          countedQuantity: 3,
          adjustmentReason: "Perda identificada na conferência física",
          stock: { warehouseId: "warehouse-1", materialId: "material-1", batchNumber: "", unitCost: 12 },
        }],
      }),
      findFirst: async () => ({ id: "inventory-1" }),
      update: async ({ data }: { data: Record<string, unknown> }) => { closedData = data; return { id: "inventory-1", ...data }; },
    },
    warehouse: { findFirst: async () => ({ id: "warehouse-1" }) },
    material: { findUnique: async () => ({ id: "material-1" }) },
    materialStock: {
      findUnique: async () => ({ id: "stock-1", unitCost: 12 }),
      updateMany: async () => ({ count: 1 }),
    },
    materialMovement: { create: async ({ data }: { data: Record<string, unknown> }) => { movements.push(data); return { id: "adjustment-1" }; } },
    inventorySessionItem: { update: async ({ data }: { data: Record<string, unknown> }) => { itemUpdates.push(data); return { id: "item-1" }; } },
  };
  const database = { $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) };

  await closeApprovedInventory(database as never, {
    sessionId: "inventory-1",
    approvalEvidence: "Despacho 42/2026 aprovado pelo gestor",
    actor: { usuarioId: "approver-1", employeeId: "employee-1" },
  });

  assert.equal(movements.length, 1);
  assert.equal(movements[0]?.type, "Ajuste");
  assert.equal(movements[0]?.quantity, -2);
  assert.equal(movements[0]?.inventorySessionId, "inventory-1");
  assert.equal(itemUpdates[0]?.adjustmentMovementId, "adjustment-1");
  assert.equal(closedData?.status, "CLOSED");
  assert.equal(closedData?.lockMovements, false);
  assert.equal(closedData?.approvalEvidence, "Despacho 42/2026 aprovado pelo gestor");
});

test("rejeita encerramento de inventário quando aprovador é o mesmo inventoriante (segregação de funções)", async () => {
  const transaction = {
    inventorySession: {
      findUnique: async () => ({
        id: "inventory-1",
        createdByUsuarioId: "user-same",
        status: "PENDING_APPROVAL",
        items: [],
      }),
    },
  };
  const database = { $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) };

  await assert.rejects(
    () =>
      closeApprovedInventory(database as never, {
        sessionId: "inventory-1",
        approvalEvidence: "Tentativa do próprio inventoriante",
        actor: { usuarioId: "user-same", employeeId: "emp-same" },
      }),
    /Segregação de Funções/,
  );
});
