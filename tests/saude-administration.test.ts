import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  healthHolidayInputSchema,
  healthProfessionalAdministrationInputSchema,
  healthStatusChangeSchema,
  healthUnitShiftInputSchema,
} from "../src/lib/saude/admin-contract.ts";

test("exige motivo para inativar unidade ou profissional", () => {
  assert.throws(() => healthStatusChangeSchema.parse({ id: "registro-1", isActive: false, reason: "" }));
  assert.deepEqual(
    healthStatusChangeSchema.parse({ id: "registro-1", isActive: false, reason: " Encerramento do vínculo " }),
    { id: "registro-1", isActive: false, reason: "Encerramento do vínculo" },
  );
  assert.doesNotThrow(() => healthStatusChangeSchema.parse({ id: "registro-1", isActive: true, reason: "" }));
});

test("valida turno e parâmetros administrativos do profissional", () => {
  assert.doesNotThrow(() => healthUnitShiftInputSchema.parse({ unitId: "unidade-1", dayOfWeek: 1, startTime: "07:00", endTime: "16:00", isActive: true }));
  assert.throws(() => healthUnitShiftInputSchema.parse({ unitId: "unidade-1", dayOfWeek: 1, startTime: "16:00", endTime: "07:00", isActive: true }));
  assert.throws(() => healthProfessionalAdministrationInputSchema.parse({
    employeeId: "pessoa-1", cns: "", treatment: "", cbo: "", councilName: "", councilNumber: "", specialtyId: "", unitId: "", weeklyHours: "20", isAuditor: false, consultationIntervalMinutes: "30",
  }));
});

test("aceita somente os tipos administrativos de feriado", () => {
  assert.doesNotThrow(() => healthHolidayInputSchema.parse({ title: "Aniversário do Município", description: "", date: "2026-06-15", type: "Municipal" }));
  assert.throws(() => healthHolidayInputSchema.parse({ title: "Evento", description: "", date: "2026-06-15", type: "Expediente Especial" }));
});

test("migration F1-A é incremental e preserva as tabelas clínicas", async () => {
  const migration = await readFile(new URL("../prisma/migrations/20260920110000_add_health_administration_structure/migration.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE "HealthSpecialty"/);
  assert.match(migration, /CREATE TABLE "HealthSpecialtyGroup"/);
  assert.match(migration, /CREATE TABLE "HealthProfessionalAssignment"/);
  assert.match(migration, /CREATE TABLE "HealthUnitShift"/);
  assert.match(migration, /CREATE TABLE "HealthRegistrationStatusHistory"/);
  assert.doesNotMatch(migration, /DROP TABLE/);
  assert.doesNotMatch(migration, /TRUNCATE/);
});
