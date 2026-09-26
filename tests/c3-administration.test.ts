import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  assertAdministratorLifecycleChange,
  assertLifecycleCanDeactivate,
  isSystemAdministratorProfileCode,
  normalizeOptionalInstitutionIdentifiers,
  normalizeRestrictiveProfilePermissions,
  resolveEmployeeHierarchy,
  SYSTEM_ADMIN_PROFILE_CODE,
} from "../src/lib/administration/c3-policy";
import { createFirebaseUserProvisioner, isStrongFirebasePassword } from "../src/lib/firebase/user-provisioning";
import { auditEventTypes, writeAuditEvent } from "../src/lib/platform/audit-evidence";

test("institution identifiers are optional and validated only when supplied", () => {
  assert.deepEqual(normalizeOptionalInstitutionIdentifiers({ cnpj: "", zipCode: "" }), { cnpj: null, zipCode: null });
  assert.deepEqual(normalizeOptionalInstitutionIdentifiers({ cnpj: "04.252.011/0001-10", zipCode: "01310-100" }), { cnpj: "04252011000110", zipCode: "01310100" });
  assert.throws(() => normalizeOptionalInstitutionIdentifiers({ cnpj: "123", zipCode: "" }), /CNPJ inválido/);
  assert.throws(() => normalizeOptionalInstitutionIdentifiers({ cnpj: "", zipCode: "123" }), /CEP inválido/);
});

test("system administration uses a stable profile code and protects administrator lifecycle", () => {
  assert.equal(isSystemAdministratorProfileCode(SYSTEM_ADMIN_PROFILE_CODE), true);
  assert.equal(isSystemAdministratorProfileCode("Administrador"), false);
  assert.throws(() => assertAdministratorLifecycleChange({ actorUsuarioId: "admin", targetUsuarioId: "admin", targetIsSystemAdministrator: true, targetWillBeSystemAdministrator: true, targetWillBeActive: false, activeSystemAdministratorCount: 2 }), /próprio acesso/);
  assert.throws(() => assertAdministratorLifecycleChange({ actorUsuarioId: "other", targetUsuarioId: "admin", targetIsSystemAdministrator: true, targetWillBeSystemAdministrator: false, targetWillBeActive: true, activeSystemAdministratorCount: 1 }), /último administrador/);
  assert.doesNotThrow(() => assertAdministratorLifecycleChange({ actorUsuarioId: "other", targetUsuarioId: "admin", targetIsSystemAdministrator: true, targetWillBeSystemAdministrator: false, targetWillBeActive: true, activeSystemAdministratorCount: 2 }));
  const permissions = JSON.parse(normalizeRestrictiveProfilePermissions(JSON.stringify({ acesso: "total", modules: {} }), new Set(["ADMINISTRACAO"])));
  assert.equal(permissions.acesso, "operacional");
});

test("employee hierarchy derives secretariat from department and rejects unsafe relations", () => {
  assert.deepEqual(resolveEmployeeHierarchy({ requestedSecretariatId: null, department: { id: "department", secretariatId: "secretariat", isActive: true }, secretariat: null, unit: { id: "unit", secretariatId: "secretariat", isActive: true } }), { secretariatId: "secretariat" });
  assert.throws(() => resolveEmployeeHierarchy({ requestedSecretariatId: "other", department: { id: "department", secretariatId: "secretariat", isActive: true }, secretariat: { id: "other", isActive: true }, unit: null }), /determinada pelo departamento/);
  assert.throws(() => resolveEmployeeHierarchy({ requestedSecretariatId: "secretariat", department: null, secretariat: { id: "secretariat", isActive: true }, unit: { id: "unit", secretariatId: "other", isActive: true } }), /unidade administrativa/);
});

test("lifecycle blockers prevent deactivation with active children or references", () => {
  assert.throws(() => assertLifecycleCanDeactivate({ entity: "a secretaria", activeChildrenOrReferences: 1 }), /vínculos ativos/);
  assert.doesNotThrow(() => assertLifecycleCanDeactivate({ entity: "o departamento", activeChildrenOrReferences: 0 }));
});

test("Firebase provisioner creates immediately usable password credentials", async () => {
  const calls: unknown[] = [];
  const provisioner = createFirebaseUserProvisioner({
    getUser: async () => ({ uid: "unused" }),
    getUserByEmail: async () => { throw { code: "auth/user-not-found" }; },
    createUser: async (input) => { calls.push(input); return { uid: "firebase-1" }; },
    updateUser: async (uid, input) => { calls.push({ uid, ...input }); return { uid }; },
  });
  assert.equal(isStrongFirebasePassword("Password1!"), true);
  assert.equal(isStrongFirebasePassword("password"), false);
  assert.deepEqual(await provisioner.provision({ email: " USER@EXAMPLE.GOV.BR ", displayName: "User", disabled: false, password: "Password1!" }), { firebaseUid: "firebase-1" });
  assert.deepEqual(calls, [{ email: "user@example.gov.br", displayName: "User", disabled: false, emailVerified: true, password: "Password1!" }]);
  await provisioner.provision({ email: "user@example.gov.br", displayName: "User Updated", disabled: true, firebaseUid: "firebase-1" });
  assert.deepEqual(calls.at(-1), { uid: "firebase-1", email: "user@example.gov.br", displayName: "User Updated", disabled: true, emailVerified: true });
});

test("administrative audit events persist stable identifiers and migration remains additive", async () => {
  const events: unknown[] = [];
  await writeAuditEvent({ auditEvent: { create: async ({ data }: { data: unknown }) => { events.push(data); } } } as never, {
    actorUsuarioId: "actor-1", eventType: auditEventTypes.administrativeMutation, targetType: "EMPLOYEE", targetId: "employee-1",
  });
  assert.deepEqual(events, [{ actorUsuarioId: "actor-1", eventType: "ADMINISTRATIVE_MUTATION", targetType: "EMPLOYEE", targetId: "employee-1" }]);
  const migration = await readFile(path.join(process.cwd(), "prisma/migrations/20260817160000_add_c3_administration_integrity/migration.sql"), "utf8");
  const schema = await readFile(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
  assert.match(migration, /ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(migration, /ADD COLUMN "firebaseUid" TEXT/);
  assert.match(schema, /model ConfiguracaoPerfil \{\s+id\s+String\s+@id @default\(cuid\(\)\)\s+codigo\s+String\s+@unique/);
  assert.doesNotMatch(migration, /DROP TABLE|DELETE FROM/i);
});
