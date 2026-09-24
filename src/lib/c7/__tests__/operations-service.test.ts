import assert from "node:assert/strict";
import test from "node:test";
import { C7OperationError, createInternalControlPlan, registerFleetOperation } from "../operations-service";

test("C7 requires a title and reference before creating a control plan", async () => {
  await assert.rejects(
    () => createInternalControlPlan({} as never, { usuarioId: "user-1" }, { title: "", reference: "" }),
    C7OperationError,
  );
});

test("C7 rejects invalid fleet costs before accessing the database", async () => {
  await assert.rejects(
    () => registerFleetOperation({} as never, { usuarioId: "user-1" }, { assetId: "asset-1", type: "ABASTECIMENTO", occurredAt: new Date(), cost: -1, description: "Combustível" }),
    C7OperationError,
  );
});
