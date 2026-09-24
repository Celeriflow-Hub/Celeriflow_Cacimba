import assert from "node:assert/strict";
import test from "node:test";
import { intervalsOverlap, makeSupportCode, parseEducacensoFile, validateEducacensoRows, validateScheduleInterval } from "../src/lib/educacao/s1.ts";

test("interpreta registros do arquivo de intercâmbio educacional", () => {
  const rows = parseEducacensoFile("ESCOLA;41000123;Escola Central\nESTUDANTE;A-10;Ana Silva");
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { line: 1, type: "ESCOLA", fields: ["41000123", "Escola Central"] });
  assert.deepEqual(validateEducacensoRows(rows), []);
});

test("aponta linha e tipo incompatível sem aceitar silenciosamente", () => {
  const issues = validateEducacensoRows(parseEducacensoFile("OUTRO;1;Nome\nTURMA;T1"));
  assert.deepEqual(issues.map((item) => item.line), [1, 2]);
});

test("valida intervalos e conflitos de horário", () => {
  assert.equal(validateScheduleInterval("08:00", "08:50"), true);
  assert.equal(validateScheduleInterval("09:00", "08:50"), false);
  assert.equal(intervalsOverlap("08:00", "08:50", "08:40", "09:30"), true);
  assert.equal(intervalsOverlap("08:00", "08:50", "08:50", "09:30"), false);
});

test("gera código de matrícula determinístico", () => {
  assert.equal(makeSupportCode(2026, "ALU-0001"), "MAT-2026-ALU0001");
});
