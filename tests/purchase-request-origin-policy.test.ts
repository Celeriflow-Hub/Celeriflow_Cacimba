import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPurchaseRequestOrigin,
  canManagePurchaseRequest,
  canSelectAnyPurchaseRequestOrigin,
  PurchaseRequestOriginError,
  purchaseRequestOriginScope,
} from "../src/lib/compras/purchase-request-policy.ts";

const operator = {
  profileCode: "COMPRAS_OPERADOR",
  employeeId: "employee-1",
  secretariatId: "secretariat-1",
  departmentId: "department-1",
};

test("CLC-023 restricts a purchase request to the authenticated employee origin", () => {
  assert.deepEqual(purchaseRequestOriginScope(operator), { secretariatId: "secretariat-1", departmentId: "department-1" });
  assert.doesNotThrow(() => assertPurchaseRequestOrigin(operator, { secretariatId: "secretariat-1", departmentId: "department-1" }));
  assert.throws(
    () => assertPurchaseRequestOrigin(operator, { secretariatId: "secretariat-2", departmentId: "department-2" }),
    PurchaseRequestOriginError,
  );
  assert.equal(canManagePurchaseRequest(operator, {
    requesterId: "employee-1",
    secretariatId: "secretariat-1",
    departmentId: "department-1",
    status: "Rascunho",
  }), true);
  assert.equal(canManagePurchaseRequest(operator, {
    requesterId: "employee-2",
    secretariatId: "secretariat-1",
    departmentId: "department-1",
    status: "Rascunho",
  }), false);
  assert.equal(canManagePurchaseRequest(operator, {
    requesterId: "employee-1",
    secretariatId: "secretariat-1",
    departmentId: "department-1",
    status: "Aprovada",
  }), false);
});

test("CLC-023 rejects operators without a complete employee origin", () => {
  const withoutDepartment = { ...operator, departmentId: null };
  assert.equal(purchaseRequestOriginScope(withoutDepartment), null);
  assert.throws(
    () => assertPurchaseRequestOrigin(withoutDepartment, { secretariatId: "secretariat-1", departmentId: "department-1" }),
    /servidor, secretaria e departamento/i,
  );
});

test("CLC-023 preserves the explicit system administrator exception", () => {
  const administrator = { ...operator, profileCode: "SYSTEM_ADMINISTRATOR", employeeId: null, secretariatId: null, departmentId: null };
  assert.equal(canSelectAnyPurchaseRequestOrigin(administrator), true);
  assert.equal(purchaseRequestOriginScope(administrator), null);
  assert.doesNotThrow(() => assertPurchaseRequestOrigin(administrator, { secretariatId: "secretariat-2", departmentId: "department-2" }));
  assert.equal(canManagePurchaseRequest(administrator, {
    requesterId: "employee-2",
    secretariatId: "secretariat-2",
    departmentId: "department-2",
    status: "Rascunho",
  }), true);
});
