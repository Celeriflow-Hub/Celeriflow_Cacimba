import assert from "node:assert/strict";
import test from "node:test";
import { createFinanceReportDataset, financeInternalReportDefinition, financeInternalReportKey } from "../src/lib/financeiro/report-definition.ts";

test("adapts the Finance report dataset without copying or filtering its report data", () => {
  const report = {
    title: "Balancete Contábil Acumulado",
    year: 2026,
    warnings: ["Uso interno."],
    metadata: {
      status: "INTERNAL_REVIEW" as const,
      scope: "Exercício consolidado",
      referencePeriod: "Exercício 2026",
      statutoryCompleteness: "NOT_STATUTORY" as const,
      publicSnapshotEligible: false,
      publicSnapshotCondition: "Não aprovado para snapshot público.",
    },
    sections: [{ title: "Saldos", rows: [{ conta: "1.1.1", saldo: 100 }] }],
  };
  const dataset = createFinanceReportDataset({ id: "year-2026", year: 2026 }, "BALANCETE", report);

  assert.deepEqual(dataset, { financialYearId: "year-2026", reportType: "BALANCETE", report });
  assert.equal(dataset.report, report);
  assert.deepEqual(financeInternalReportDefinition.auditTarget(dataset), {
    targetType: "REPORT_DEFINITION",
    targetId: financeInternalReportKey,
  });
});
