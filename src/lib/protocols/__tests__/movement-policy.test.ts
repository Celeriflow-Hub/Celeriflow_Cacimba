import assert from "node:assert/strict";
import test from "node:test";
import { assertMovementCanBeCancelled, assertMovementCanBeRejected, PENDING_MOVEMENT_STATUS } from "../movement-policy";

const pendingMovement = {
  processStatus: "Aguardando Recebimento",
  movementStatus: PENDING_MOVEMENT_STATUS,
  fromDepartmentId: "origin",
  toDepartmentId: "destination",
  currentDepartmentId: "destination",
  actorDepartmentId: "origin",
  isGenericWorkflow: false,
};

test("only the origin can cancel a pending manual forwarding", () => {
  assert.doesNotThrow(() => assertMovementCanBeCancelled(pendingMovement));
  assert.throws(
    () => assertMovementCanBeCancelled({ ...pendingMovement, actorDepartmentId: "other" }),
    /setor de origem/,
  );
});

test("only the destination can reject a pending manual forwarding", () => {
  assert.doesNotThrow(() => assertMovementCanBeRejected({ ...pendingMovement, actorDepartmentId: "destination" }));
  assert.throws(
    () => assertMovementCanBeRejected(pendingMovement),
    /setor de destino/,
  );
});

test("terminal, initial, and generic transitions cannot use manual reversal", () => {
  assert.throws(
    () => assertMovementCanBeCancelled({ ...pendingMovement, processStatus: "Recebido" }),
    /não está mais aguardando/,
  );
  assert.throws(
    () => assertMovementCanBeRejected({ ...pendingMovement, fromDepartmentId: null, actorDepartmentId: "destination" }),
    /distribuição inicial/,
  );
  assert.throws(
    () => assertMovementCanBeRejected({ ...pendingMovement, actorDepartmentId: "destination", isGenericWorkflow: true }),
    /fluxo genérico/,
  );
});
