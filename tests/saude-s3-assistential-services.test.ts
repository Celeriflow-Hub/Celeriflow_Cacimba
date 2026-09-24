import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { normalizeStockMovement, StockServiceError } from "../src/lib/patrimonio/stock-service";
import { healthAdministrativeReportOptions } from "../src/lib/saude/health-report-catalog";

const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync("prisma/migrations/20260921010000_add_s3_assistential_services/migration.sql", "utf8");

test("S3 uses MaterialStock and MaterialMovement as the shared ledger", () => {
  assert.match(schema, /model HealthMaterialProfile[\s\S]*materialId\s+String\s+@unique/);
  assert.match(schema, /model MedicineDispensation[\s\S]*movementId\s+String\?\s+@unique/);
  assert.match(schema, /model VaccinationRecord[\s\S]*movementId\s+String\?\s+@unique/);
  assert.match(schema, /model SpecializedDistribution[\s\S]*movementId\s+String\s+@unique/);
  assert.doesNotMatch(schema, /model VaccineStock/);
});

test("health receipts and transfer receipts are authorized entry origins", () => {
  for (const sourceType of ["HEALTH_RECEIPT", "STOCK_TRANSFER_RECEIPT"] as const) {
    assert.doesNotThrow(() => normalizeStockMovement({ kind: "ENTRY", sourceType, warehouseId: "w", materialId: "m", batchNumber: "l", quantity: 1, actor: { usuarioId: "u" } }));
  }
  assert.throws(() => normalizeStockMovement({ kind: "ENTRY", warehouseId: "w", materialId: "m", quantity: 1, actor: { usuarioId: "u" } }), StockServiceError);
});

test("migration isolates assistential structures and avoids unrelated destructive SQL", () => {
  assert.match(migration, /CREATE TABLE(?: IF NOT EXISTS)? "HealthStockReceipt"/);
  assert.match(migration, /CREATE TABLE(?: IF NOT EXISTS)? "HealthLabOrder"/);
  assert.match(migration, /CREATE TABLE(?: IF NOT EXISTS)? "SpecializedTherapeuticPlan"/);
  assert.doesNotMatch(migration, /DROP TABLE/);
  assert.doesNotMatch(migration, /Bidding/);
  assert.doesNotMatch(migration, /TaxRegistry/);
});

test("all detailed S3 report ranges are registered in the central report catalog", () => {
  const requirements = new Set(healthAdministrativeReportOptions.map(option => option.requirement));
  for (let id = 58; id <= 73; id += 1) assert.ok(requirements.has(`SAU-FAR-${String(id).padStart(3, "0")}` as never));
  for (let id = 50; id <= 71; id += 1) assert.ok(requirements.has(`SAU-LAB-${String(id).padStart(3, "0")}` as never));
  for (let id = 50; id <= 55; id += 1) assert.ok(requirements.has(`SAU-ESP-${String(id).padStart(3, "0")}` as never));
  for (const id of [121, 122, 123, 124, 125]) assert.ok(requirements.has(`SAU-SIS-${id}` as never));
});
