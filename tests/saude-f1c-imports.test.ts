import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  healthSusImportInputSchema,
  healthSusRecordValue,
  parseHealthSusImport,
} from "../src/lib/saude/sus-import-contract.ts";

test("valida origem e competência das cargas SUS", () => {
  assert.deepEqual(healthSusImportInputSchema.parse({ source: "CNES", competence: "2026-09", origin: "Arquivo do setor responsável" }), {
    source: "CNES", competence: "2026-09", origin: "Arquivo do setor responsável",
  });
  assert.throws(() => healthSusImportInputSchema.parse({ source: "OUTRA", competence: "2026-09", origin: "Setor" }));
  assert.throws(() => healthSusImportInputSchema.parse({ source: "SIGTAP", competence: "09/2026", origin: "Setor" }));
});

test("interpreta CSV delimitado e preserva campos entre aspas", () => {
  const records = parseHealthSusImport([
    "tipo;codigo;descricao;valor_unitario",
    'procedimento;0301010072;\"Consulta, avaliação e acompanhamento\";12,50',
  ].join("\n"), "csv");
  assert.equal(records.length, 1);
  assert.equal(healthSusRecordValue(records[0], "tipo"), "procedimento");
  assert.equal(healthSusRecordValue(records[0], "descrição", "descricao"), "Consulta, avaliação e acompanhamento");
  assert.equal(healthSusRecordValue(records[0], "valor_unitario"), "12,50");
});

test("preserva quebra de linha entre aspas e rejeita quantidade de colunas divergente", () => {
  const records = parseHealthSusImport('tipo;codigo;descricao\nprocedimento;01;"Descrição em\nduas linhas"', "csv");
  assert.equal(healthSusRecordValue(records[0], "descricao"), "Descrição em\nduas linhas");
  assert.throws(() => parseHealthSusImport("tipo;codigo\nprocedimento;01;campo-extra", "csv"));
  assert.throws(() => parseHealthSusImport("tipo;codigo\nprocedimento", "csv"));
});

test("interpreta XML do contrato local por tipo de registro", () => {
  const records = parseHealthSusImport("<carga><registro tipo=\"unidade\"><cnes>1234567</cnes><nome>Unidade Central</nome></registro><equipe><codigo>EQ01</codigo><nome>Equipe Norte</nome></equipe></carga>", "xml");
  assert.equal(records.length, 2);
  assert.equal(healthSusRecordValue(records[0], "tipo"), "unidade");
  assert.equal(healthSusRecordValue(records[1], "tipo"), "equipe");
});

test("rejeita arquivo vazio, extensão indevida e XML sem registros reconhecidos", () => {
  assert.throws(() => parseHealthSusImport("", "csv"));
  assert.throws(() => parseHealthSusImport("conteúdo", "json"));
  assert.throws(() => parseHealthSusImport("<carga><item /></carga>", "xml"));
});

test("migration F1-C é incremental, rastreável e idempotente", async () => {
  const migration = await readFile(new URL("../prisma/migrations/20260920160000_add_health_sus_imports/migration.sql", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE "HealthSusImportBatch"/);
  assert.match(migration, /CREATE TABLE "HealthSusImportIssue"/);
  assert.match(migration, /CREATE TABLE "HealthSusProcedure"/);
  assert.match(migration, /CREATE TABLE "HealthSusReference"/);
  assert.match(migration, /CREATE TABLE "HealthSusProcedureReference"/);
  assert.match(migration, /HealthSusImportBatch_source_competence_checksum_key/);
  assert.match(migration, /HealthSusProcedure_sourceBatchId_code_key/);
  assert.match(migration, /REFERENCES "Usuario"/);
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE/);
});

test("processador reutiliza cadastros globais e sanitários existentes", async () => {
  const service = await readFile(new URL("../src/lib/saude/sus-import-service.ts", import.meta.url), "utf8");
  assert.match(service, /tx\.person\.upsert/);
  assert.match(service, /tx\.patient\.upsert/);
  assert.match(service, /tx\.healthUnit\.upsert/);
  assert.match(service, /tx\.healthProfessional\.upsert/);
  assert.match(service, /tx\.healthTeam\.upsert/);
  assert.doesNotMatch(service, /createHealthPerson|createHealthPatient/);
});
