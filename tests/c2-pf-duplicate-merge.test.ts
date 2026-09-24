import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { externalIdentifierLookupEnvironment, requireValidCep, requireValidCnpj, requireValidCpf, validateCep, validateCnpj, validateCpf } from "../src/lib/identifiers/brazilian-identifiers.ts";
import { assertDifferentSystemAdministrators, assertMergeReversalAllowed, assertPersonMergeEligible, getPersonMergeEligibilityBlocks, rankPersonMergeCandidates, type PersonMergeManifest } from "../src/lib/cadastros/person-merge-policy.ts";

test("normalizes and checksum-validates CPF, CNPJ, and CEP locally", () => {
  assert.deepEqual(validateCpf("529.982.247-25"), { normalized: "52998224725", valid: true });
  assert.deepEqual(validateCnpj("04.252.011/0001-10"), { normalized: "04252011000110", valid: true });
  assert.deepEqual(validateCep("01001-000"), { normalized: "01001000", valid: true });
  assert.equal(validateCpf("111.111.111-11").valid, false);
  assert.equal(validateCnpj("04.252.011/0001-11").valid, false);
  assert.equal(validateCep("01001-00").valid, false);
  assert.equal(requireValidCpf("529.982.247-25"), "52998224725");
  assert.equal(requireValidCnpj("04.252.011/0001-10"), "04252011000110");
  assert.equal(requireValidCep("01001-000"), "01001000");
  assert.equal(externalIdentifierLookupEnvironment, "MOCK");
});

test("ranks duplicate candidates for review without selecting or merging them", () => {
  const ranked = rankPersonMergeCandidates(
    { id: "source", fullName: "Ana D'Ávila", cpf: "52998224725", birthDate: new Date("1990-02-03"), email: "ana@example.test", phonePrimary: "(28) 99999-0000" },
    [
      { id: "name-and-birth", fullName: "Ana Davila", cpf: "12345678909", birthDate: new Date("1990-02-03") },
      { id: "email", fullName: "Outra Pessoa", cpf: "98765432100", email: "ANA@example.test" },
      { id: "archived", fullName: "Ana Davila", cpf: "00000000000", status: "Arquivado por mesclagem" },
    ],
  );
  assert.deepEqual(ranked, [
    { personId: "name-and-birth", score: 80, reasons: ["NOME_NORMALIZADO", "DATA_NASCIMENTO"] },
    { personId: "email", score: 10, reasons: ["EMAIL_NORMALIZADO"] },
  ]);
});

test("blocks every protected source-link category", () => {
  const blocked = getPersonMergeEligibilityBlocks({ fiscal: true, financial: true, rh: true, health: true, education: true, social: true, process: true, attendance: true, signedDocument: true });
  assert.deepEqual(blocked, ["FISCAL", "FINANCIAL", "RH", "HEALTH", "EDUCATION", "SOCIAL", "PROCESS", "ATTENDANCE", "SIGNEDDOCUMENT"]);
  assert.throws(() => assertPersonMergeEligible({ fiscal: false, financial: false, rh: false, health: false, education: false, social: false, process: false, attendance: false, signedDocument: true }), /SIGNEDDOCUMENT/);
  assert.doesNotThrow(() => assertPersonMergeEligible({ fiscal: false, financial: false, rh: false, health: false, education: false, social: false, process: false, attendance: false, signedDocument: false }));
});

test("requires a different system administrator to approve and execute", () => {
  assert.doesNotThrow(() => assertDifferentSystemAdministrators("admin-a", "admin-b"));
  assert.throws(() => assertDifferentSystemAdministrators("admin-a", "admin-a"), /diferente/);
});

test("permits reversal only while moved records and destination have no later changes", () => {
  const manifest: PersonMergeManifest = {
    version: 1,
    sourcePersonId: "source",
    targetPersonId: "target",
    sourcePreviousStatus: "Ativo",
    executedAt: "2026-08-17T12:00:00.000Z",
    addressIds: ["address-1"],
    documentIds: ["document-1"],
  };
  assert.doesNotThrow(() => assertMergeReversalAllowed(manifest, "Arquivado por mesclagem", new Date("2026-08-17T12:00:00.000Z"), [
    { id: "address-1", personId: "target", updatedAt: new Date("2026-08-17T12:00:00.000Z") },
    { id: "document-1", personId: "target", updatedAt: new Date("2026-08-17T12:00:00.000Z") },
  ]));
  assert.throws(() => assertMergeReversalAllowed(manifest, "Arquivado por mesclagem", new Date("2026-08-17T12:00:01.000Z"), []), /destino recebeu alterações/);
  assert.throws(() => assertMergeReversalAllowed(manifest, "Arquivado por mesclagem", new Date("2026-08-17T12:00:00.000Z"), [{ id: "address-1", personId: "source", updatedAt: new Date("2026-08-17T12:00:00.000Z") }]), /itens transferidos/);
  assert.throws(() => assertMergeReversalAllowed(manifest, "Arquivado por mesclagem", new Date("2026-08-17T12:00:00.000Z"), [], new Date("2026-08-17T12:00:01.000Z")), /origem recebeu alterações/);
});

test("migration constrains PF merge state and makes the manifest ledger append-only", async () => {
  const migration = await readFile(new URL("../prisma/migrations/20260817140000_add_c2_pf_duplicate_merge/migration.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE "PersonMergeRequest"/);
  assert.match(migration, /"sourcePersonId" <> "targetPersonId"/);
  assert.match(migration, /"approvedByUsuarioId" <> "proposedByUsuarioId"/);
  assert.match(migration, /CREATE TABLE "PersonMergeLedger"/);
  assert.match(migration, /"manifest" JSONB NOT NULL/);
  assert.match(migration, /BEFORE UPDATE OR DELETE ON "PersonMergeLedger"/);
});
