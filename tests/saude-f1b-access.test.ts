import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { healthUserAccessInputSchema } from "../src/lib/saude/admin-contract.ts";
import { isHealthAccessScopeValid, isStrongHealthPassword } from "../src/lib/saude/health-access-policy.ts";

const validAccess = {
  usuarioId: "usuario-1",
  perfilId: "perfil-1",
  employeeId: "servidor-1",
  ativo: true,
  canView: true,
  canEdit: true,
  unitIds: ["unidade-1"],
  validFrom: "2026-09-01",
  validUntil: "2026-09-30",
  weekdays: [1, 2, 3, 4, 5],
  startTime: "08:00",
  endTime: "17:00",
};

test("valida vínculo, permissão e período do acesso à Saúde", () => {
  assert.doesNotThrow(() => healthUserAccessInputSchema.parse(validAccess));
  assert.throws(() => healthUserAccessInputSchema.parse({ ...validAccess, unitIds: [] }));
  assert.throws(() => healthUserAccessInputSchema.parse({ ...validAccess, canView: false, canEdit: true }));
  assert.throws(() => healthUserAccessInputSchema.parse({ ...validAccess, validUntil: "2026-08-31" }));
  assert.throws(() => healthUserAccessInputSchema.parse({ ...validAccess, startTime: "18:00", endTime: "17:00" }));
});

test("aplica vigência, dia e horário sem ampliar o escopo", () => {
  const scope = { unitId: "unidade-1", validFrom: "2026-09-01", validUntil: "2026-09-30", weekdays: "1,2,3,4,5", startTime: "08:00", endTime: "17:00", isActive: true };
  assert.equal(isHealthAccessScopeValid(scope, { date: "2026-09-21", weekday: 1, time: "10:00" }), true);
  assert.equal(isHealthAccessScopeValid(scope, { date: "2026-09-20", weekday: 0, time: "10:00" }), false);
  assert.equal(isHealthAccessScopeValid(scope, { date: "2026-10-01", weekday: 4, time: "10:00" }), false);
  assert.equal(isHealthAccessScopeValid(scope, { date: "2026-09-21", weekday: 1, time: "18:00" }), false);
});

test("exige senha forte antes de enviar a alteração ao Firebase", () => {
  assert.equal(isStrongHealthPassword("Saude#2026"), true);
  assert.equal(isStrongHealthPassword("saude2026"), false);
  assert.equal(isStrongHealthPassword("SAUDE#SEMNUMERO"), false);
});

test("migration F1-B é incremental e mantém identidade global", async () => {
  const migration = await readFile(new URL("../prisma/migrations/20260920120000_add_health_user_access_scope/migration.sql", import.meta.url), "utf8");
  assert.match(migration, /ALTER TABLE "Person" ADD COLUMN "raceColor"/);
  assert.match(migration, /CREATE TABLE "HealthUserAccessScope"/);
  assert.match(migration, /REFERENCES "Usuario"/);
  assert.match(migration, /REFERENCES "HealthUnit"/);
  assert.doesNotMatch(migration, /CREATE TABLE "HealthUser"/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE/);
});
