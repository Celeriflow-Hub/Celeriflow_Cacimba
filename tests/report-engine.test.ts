import assert from "node:assert/strict";
import test from "node:test";
import { createReportExecution, isReportFormat, renderReport, writeReportIssuanceAudit, type AuthorizedReportExecution } from "../src/lib/reports/report-engine.ts";

test("recognizes only the ReportEngine formats", () => {
  assert.equal(isReportFormat("preview"), true);
  assert.equal(isReportFormat("pdf"), true);
  assert.equal(isReportFormat("csv"), true);
  assert.equal(isReportFormat("xlsx"), true);
  assert.equal(isReportFormat("txt"), true);
  assert.equal(isReportFormat("print"), true);
  assert.equal(isReportFormat("PDF"), false);
});

test("builds an execution without changing the authorized dataset", () => {
  const definition = { key: "test.report" };
  const dataset = { title: "Dataset canônico" };

  const execution = createReportExecution(definition, "preview", dataset);

  assert.deepEqual(execution, { key: "test.report", format: "preview", dataset });
  assert.equal(execution.dataset, dataset);
});

test("routes each supported renderer and leaves previews unrendered", async () => {
  const execution = { key: "test.report", format: "xlsx", dataset: { title: "Dataset" }, context: {}, definition: {} } as never as AuthorizedReportExecution<never, { title: string }>;
  const rendered = await renderReport(execution, {
    xlsx: () => "xlsx",
  });

  assert.equal(rendered, "xlsx");
  await assert.rejects(() => renderReport({ ...execution, format: "preview" }, { xlsx: () => "xlsx" }), /Formato de relatório não suportado/);
});

test("audits every non-preview report with the definition identifier", async () => {
  const calls: unknown[] = [];
  const definition = {
    key: "test.report",
    moduleCode: "TEST",
    createDataset: async () => ({ title: "unused" }),
    auditTarget: () => ({ targetType: "REPORT_DEFINITION", targetId: "test.report" }),
  };
  const context = {
    user: { id: "user-1" },
    prisma: { auditEvent: { create: async ({ data }: { data: unknown }) => { calls.push(data); } } },
  };

  for (const format of ["preview", "pdf", "csv", "xlsx", "txt", "print"] as const) {
    await writeReportIssuanceAudit({ key: "test.report", format, dataset: { title: "Dataset" }, context, definition } as never as AuthorizedReportExecution<never, { title: string }>);
  }

  assert.deepEqual(calls, [
    { actorUsuarioId: "user-1", eventType: "REPORT_ISSUED", targetType: "REPORT_DEFINITION", targetId: "test.report" },
    { actorUsuarioId: "user-1", eventType: "REPORT_ISSUED", targetType: "REPORT_DEFINITION", targetId: "test.report" },
    { actorUsuarioId: "user-1", eventType: "REPORT_ISSUED", targetType: "REPORT_DEFINITION", targetId: "test.report" },
    { actorUsuarioId: "user-1", eventType: "REPORT_ISSUED", targetType: "REPORT_DEFINITION", targetId: "test.report" },
    { actorUsuarioId: "user-1", eventType: "REPORT_ISSUED", targetType: "REPORT_DEFINITION", targetId: "test.report" },
  ]);
});
