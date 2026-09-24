import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import { createDefaultReportTemplate } from "../src/lib/reports/report-template.ts";
import { formulaSafeCell, renderTabularCsv, renderTabularTxt, renderTabularXlsx } from "../src/lib/reports/tabular-renderers.ts";

const dataset = {
  title: "Teste",
  year: 2026,
  warnings: [],
  metadata: { status: "INTERNAL_REVIEW" as const, scope: "Teste", referencePeriod: "2026", statutoryCompleteness: "NOT_STATUTORY" as const, publicSnapshotEligible: false, publicSnapshotCondition: "Não" },
  sections: [{ title: "Dados", rows: [{ descricao: "=HYPERLINK(\"https://invalid\")", codigo: "+123", valor: 20 }] }],
};

const presentation = { institution: null, template: createDefaultReportTemplate(), emission: null };

test("neutralizes spreadsheet formulas in tabular text exports", () => {
  assert.equal(formulaSafeCell("=1+1"), "'=1+1");
  assert.equal(formulaSafeCell(" -unsafe"), "' -unsafe");
  assert.match(renderTabularCsv(dataset, presentation), /'=HYPERLINK/);
  assert.match(renderTabularTxt(dataset, presentation), /'\+123/);
});

test("creates a metadata cover sheet and formula-safe section sheets", async () => {
  const workbook = new ExcelJS.Workbook();
  // ExcelJS declares the legacy Node Buffer type while Node 24 returns a generic Buffer.
  const spreadsheet = Buffer.from(await renderTabularXlsx(dataset, presentation)) as unknown as Parameters<typeof workbook.xlsx.load>[0];
  await workbook.xlsx.load(spreadsheet);
  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ["Metadados do relatório", "Dados"]);
  assert.equal(workbook.getWorksheet("Dados")?.getCell("A2").value, "'=HYPERLINK(\"https://invalid\")");
});
