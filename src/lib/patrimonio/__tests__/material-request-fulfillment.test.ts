import assert from "node:assert/strict";
import { test } from "node:test";
import { createMaterialRequest, ProcurementLifecycleError, issueMaterialRequestInFull } from "../../compras/procurement-lifecycle";

const actor = { usuarioId: "user-issuer", employeeId: "employee-issuer" };

test("creates an idempotent request for the authenticated employee department", async () => {
  let createdData: Record<string, unknown> | undefined;
  const transaction = {
    materialRequest: {
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createdData = data;
        return { id: "request-1", number: "REQ-DEMO-0030" };
      },
    },
    employee: { findFirst: async () => ({ id: "employee-requester", departmentId: "department-1" }) },
    material: { findMany: async () => [{ id: "material-paper" }, { id: "material-pen" }] },
    procurementLifecycleEvent: { create: async () => ({ id: "event-1" }) },
  };
  const database = { $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) };

  const request = await createMaterialRequest(database as never, { usuarioId: "user-requester", employeeId: "employee-requester" }, {
    number: "REQ-DEMO-0030",
    idempotencyKey: "material-request-1",
    justification: "Reposição do setor demonstrativo",
    items: [
      { materialId: "material-paper", quantityRequested: 30 },
      { materialId: "material-pen", quantityRequested: 5 },
    ],
  });

  assert.equal(request.number, "REQ-DEMO-0030");
  assert.deepEqual(createdData, {
    number: "REQ-DEMO-0030",
    idempotencyKey: "material-request-1",
    justification: "Reposição do setor demonstrativo",
    departmentId: "department-1",
    requesterId: "employee-requester",
    items: {
      create: [
        { materialId: "material-paper", quantityRequested: 30 },
        { materialId: "material-pen", quantityRequested: 5 },
      ],
    },
  });
});

function approvedRequest() {
  return {
    id: "request-1",
    number: "REQ-DEMO-0030",
    status: "Aprovada",
    departmentId: "department-1",
    items: [
      { id: "request-item-paper", materialId: "material-paper", quantityApproved: 30, quantityDelivered: 0 },
      { id: "request-item-pen", materialId: "material-pen", quantityApproved: 5, quantityDelivered: 0 },
    ],
  };
}

test("full delivery issues every remaining request line in the same transaction", async () => {
  const movements: Array<Record<string, unknown>> = [];
  const itemUpdates: Array<Record<string, unknown>> = [];
  let requestStatus: Record<string, unknown> | undefined;
  const transaction = {
    procurementLifecycleEvent: {
      findUnique: async () => null,
      create: async () => ({ id: "event-1" }),
    },
    materialRequest: {
      findUnique: async () => approvedRequest(),
      updateMany: async () => ({ count: 1 }),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        requestStatus = data;
        return { id: "request-1", ...data };
      },
    },
    materialRequestItem: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        itemUpdates.push(data);
        return { id: "request-item" };
      },
    },
    materialStock: {
      findMany: async () => [
        { id: "stock-paper", warehouseId: "warehouse-1", materialId: "material-paper", batchNumber: "", unitCost: 25 },
        { id: "stock-pen", warehouseId: "warehouse-1", materialId: "material-pen", batchNumber: "", unitCost: 2 },
      ],
      findUnique: async ({ where }: { where: { warehouseId_materialId_batchNumber: { materialId: string } } }) => ({
        id: `position-${where.warehouseId_materialId_batchNumber.materialId}`,
        unitCost: where.warehouseId_materialId_batchNumber.materialId === "material-paper" ? 25 : 2,
      }),
      updateMany: async () => ({ count: 1 }),
    },
    warehouse: { findFirst: async () => ({ id: "warehouse-1" }) },
    material: { findUnique: async () => ({ id: "material-1" }) },
    inventorySession: { findFirst: async () => null },
    materialMovement: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        movements.push(data);
        return { id: `movement-${movements.length}` };
      },
    },
  };
  const database = { $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) };

  await issueMaterialRequestInFull(database as never, actor, {
    requestId: "request-1",
    stockByItem: [
      { requestItemId: "request-item-paper", stockId: "stock-paper" },
      { requestItemId: "request-item-pen", stockId: "stock-pen" },
    ],
  });

  assert.equal(movements.length, 2);
  assert.deepEqual(movements.map((movement) => movement.quantity), [30, 5]);
  assert.deepEqual(itemUpdates.map((update) => update.quantityDelivered), [{ increment: 30 }, { increment: 5 }]);
  assert.equal(requestStatus?.status, "Atendida");
});

test("full delivery rejects incomplete stock assignments before claiming the request", async () => {
  let claimed = false;
  const transaction = {
    procurementLifecycleEvent: { findUnique: async () => null },
    materialRequest: {
      findUnique: async () => approvedRequest(),
      updateMany: async () => {
        claimed = true;
        return { count: 1 };
      },
    },
  };
  const database = { $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) };

  await assert.rejects(
    issueMaterialRequestInFull(database as never, actor, {
      requestId: "request-1",
      stockByItem: [{ requestItemId: "request-item-paper", stockId: "stock-paper" }],
    }),
    ProcurementLifecycleError,
  );
  assert.equal(claimed, false);
});
