import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { assertAddressMergeCriteria, assertPatientMergeCriteria, assertProfessionalMergeCriteria, normalizeMergeText } from "../src/lib/saude/health-merge-policy.ts";

test("normaliza texto e valida os critérios obrigatórios de prontuário", () => {
  assert.equal(normalizeMergeText("  Maria   da Conceição "), "maria da conceicao");
  const person = { fullName: "Maria da Conceição", birthDate: new Date("1980-05-10T00:00:00.000Z"), motherName: "Ana Souza" };
  assert.deepEqual(assertPatientMergeCriteria(person, { ...person, fullName: "maria da conceicao" }), { sameName: true, sameBirthDate: true, sameMother: true });
  assert.throws(() => assertPatientMergeCriteria(person, { ...person, motherName: "Outra pessoa" }), /nome da mãe/);
});

test("valida duplicidade de profissional pelo nome e endereço por CEP e logradouro", () => {
  assert.deepEqual(assertProfessionalMergeCriteria("João Médico", "JOAO MEDICO"), { sameName: true });
  assert.throws(() => assertProfessionalMergeCriteria("João Médico", "José Médico"), /mesmo nome/);
  assert.deepEqual(assertAddressMergeCriteria({ zipCode: "58.700-000", streetName: "Rua São José" }, { zipCode: "58700000", streetName: "rua sao jose" }), { sameZipCode: true, sameStreet: true });
  assert.throws(() => assertAddressMergeCriteria({ zipCode: "58700000", streetName: "Rua A" }, { zipCode: "58700001", streetName: "Rua A" }), /CEP e logradouro/);
});

test("migration F1-D cria documentos, histórico de unificação e configuração laboratorial", async () => {
  const migration = await readFile(new URL("../prisma/migrations/20260920170000_add_health_documents_merges_lab_config/migration.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE "HealthStandardDocument"/);
  assert.match(migration, /CREATE TABLE "HealthAdministrativeMerge"/);
  assert.match(migration, /CREATE TABLE "HealthLaboratoryConfiguration"/);
  assert.match(migration, /"canonicalAddressId"/);
  assert.match(migration, /SAUDE_DOCUMENTO_PADRAO/);
  assert.match(migration, /ON CONFLICT \("code"\) DO UPDATE/);
});
