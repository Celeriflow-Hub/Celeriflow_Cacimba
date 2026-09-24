import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePurchasePlanningInput,
  PurchasePlanningError,
} from "../src/lib/compras/purchase-planning.ts";

const now = new Date("2026-09-19T12:00:00.000Z");

test("CLC-024 normalizes a future purchase planning need with catalog and demand origin links", () => {
  const planning = normalizePurchasePlanningInput({
    catalogItemId: "catalog-paper",
    originPurchaseRequestId: "request-admin",
    unit: "resma",
    quantity: "120",
    expectedPeriodStart: "2026-10-01",
    expectedPeriodEnd: "2026-10-31",
    estimatedValueDecimal: "1800.00",
    status: "Rascunho",
  }, now);

  assert.equal(planning.catalogItemId, "catalog-paper");
  assert.equal(planning.originPurchaseRequestId, "request-admin");
  assert.equal(planning.quantity, 120);
  assert.equal(planning.unit, "resma");
  assert.equal(planning.expectedPeriodStart.toISOString().slice(0, 10), "2026-10-01");
  assert.equal(planning.expectedPeriodEnd.toISOString().slice(0, 10), "2026-10-31");
  assert.equal(planning.estimatedValueDecimal.toString(), "1800");
});

test("CLC-024 permits a free service description but rejects invalid future planning data", () => {
  const service = normalizePurchasePlanningInput({
    description: "Horas de apoio técnico",
    unit: "hora",
    quantity: "8",
    expectedPeriodStart: "2026-11-01",
    expectedPeriodEnd: "2026-11-05",
    estimatedValueDecimal: "960,00",
  }, now);

  assert.equal(service.description, "Horas de apoio técnico");
  assert.equal(service.catalogItemId, null);
  assert.equal(service.estimatedValueDecimal.toString(), "960");
  assert.equal(service.status, "Rascunho");
  assert.throws(
    () => normalizePurchasePlanningInput({
      description: "Planejamento vencido",
      unit: "unidade",
      quantity: "1",
      expectedPeriodStart: "2026-09-18",
      expectedPeriodEnd: "2026-09-19",
      estimatedValueDecimal: "1",
    }, now),
    PurchasePlanningError,
  );
  assert.throws(
    () => normalizePurchasePlanningInput({
      description: "Período invertido",
      unit: "unidade",
      quantity: "1",
      expectedPeriodStart: "2026-10-02",
      expectedPeriodEnd: "2026-10-01",
      estimatedValueDecimal: "1",
    }, now),
    PurchasePlanningError,
  );
  assert.throws(
    () => normalizePurchasePlanningInput({
      description: "Situação inválida",
      unit: "unidade",
      quantity: "1",
      expectedPeriodStart: "2026-10-02",
      expectedPeriodEnd: "2026-10-03",
      estimatedValueDecimal: "1",
      status: "Aprovado automaticamente",
    }, now),
    PurchasePlanningError,
  );
});
