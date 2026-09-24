import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("a migration de agenda preserva historico, indices e vinculos clinicos", async () => {
  const migration = await readFile(
    new URL("../prisma/migrations/20260920100000_add_health_appointment_history/migration.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /ADD COLUMN "cancelledAt" TIMESTAMP\(3\)/);
  assert.match(migration, /ADD COLUMN "cancellationReason" TEXT/);
  assert.match(migration, /HealthAppointment_unitId_date_idx/);
  assert.match(migration, /HealthAppointment_professionalId_date_idx/);
  assert.match(migration, /HealthAppointment_patientId_date_idx/);

  for (const [constraint, column, target] of [
    ["Patient_referenceUnitId_fkey", "referenceUnitId", "HealthUnit"],
    ["Patient_teamId_fkey", "teamId", "HealthTeam"],
    ["HealthProfessional_unitId_fkey", "unitId", "HealthUnit"],
    ["HealthProfessional_teamId_fkey", "teamId", "HealthTeam"],
    ["HealthAppointment_professionalId_fkey", "professionalId", "HealthProfessional"],
    ["MedicalRecord_appointmentId_fkey", "appointmentId", "HealthAppointment"],
  ]) {
    assert.match(migration, new RegExp(`DROP CONSTRAINT "${constraint}"`));
    assert.match(migration, new RegExp(`ADD CONSTRAINT "${constraint}" FOREIGN KEY \\("${column}"\\) REFERENCES "${target}"\\("id"\\) ON DELETE RESTRICT ON UPDATE CASCADE`));
  }
});
