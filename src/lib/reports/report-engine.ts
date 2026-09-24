import { writeAuditEvent, auditEventTypes } from "@/lib/platform/audit-evidence";
import type { AppContext } from "@/lib/platform/tenant-context";

export const reportFormats = ["preview", "pdf", "csv", "xlsx", "txt", "print"] as const;
export type ReportFormat = (typeof reportFormats)[number];
export type ReportDataset = object;

export type ReportDefinition<Input, Dataset extends ReportDataset> = {
  key: string;
  moduleCode: string;
  createDataset: (context: AppContext, input: Input) => Promise<Dataset>;
  auditTarget: (dataset: Dataset) => { targetType: string; targetId: string };
};

export type ReportExecution<Dataset extends ReportDataset> = {
  key: string;
  format: ReportFormat;
  dataset: Dataset;
};

export type AuthorizedReportExecution<Input, Dataset extends ReportDataset> = ReportExecution<Dataset> & {
  context: AppContext;
  definition: ReportDefinition<Input, Dataset>;
};

export type ReportRenderer<Input, Dataset extends ReportDataset, Result> = (execution: AuthorizedReportExecution<Input, Dataset>) => Promise<Result> | Result;

export function isReportFormat(value: string | null | undefined): value is ReportFormat {
  return typeof value === "string" && (reportFormats as readonly string[]).includes(value);
}

export function createReportExecution<Dataset extends ReportDataset>(
  definition: { key: string },
  format: ReportFormat,
  dataset: Dataset,
): ReportExecution<Dataset> {
  return { key: definition.key, format, dataset };
}

export async function executeReport<Input, Dataset extends ReportDataset>(
  definition: ReportDefinition<Input, Dataset>,
  input: Input,
  format: ReportFormat,
): Promise<AuthorizedReportExecution<Input, Dataset>> {
  const { getTenantContextForModuleOperation } = await import("@/lib/platform/tenant-context");
  const context = await getTenantContextForModuleOperation(definition.moduleCode, "issueReports");
  const dataset = await definition.createDataset(context, input);
  return { ...createReportExecution(definition, format, dataset), context, definition };
}

export async function writeReportIssuanceAudit<Input, Dataset extends ReportDataset>(execution: AuthorizedReportExecution<Input, Dataset>) {
  if (execution.format === "preview") return;

  const target = execution.definition.auditTarget(execution.dataset);
  await writeAuditEvent(execution.context.prisma, {
    actorUsuarioId: execution.context.user.id,
    eventType: auditEventTypes.reportIssued,
    targetType: target.targetType,
    targetId: target.targetId,
  });
}

export async function renderReport<Input, Dataset extends ReportDataset, Result>(
  execution: AuthorizedReportExecution<Input, Dataset>,
  renderers: Partial<Record<ReportFormat, ReportRenderer<Input, Dataset, Result>>>,
) {
  const renderer = renderers[execution.format];
  if (!renderer) throw new Error(`Formato de relatório não suportado: ${execution.format}.`);
  return renderer(execution);
}
