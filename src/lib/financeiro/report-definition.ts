import type { ReportDefinition } from "@/lib/reports/report-engine";
import {
  generateInternalReportDataset,
  type InternalReportDataset,
  type InternalReportType,
} from "./report-delivery";
import { createReportTemplatePresentation, type ReportEmissionMetadata, type ReportInstitutionIdentity } from "@/lib/reports/report-template";

export const financeInternalReportKey = "finance.internal";

export type FinanceReportInput = {
  financialYearId: string;
  reportType: InternalReportType;
  month?: number;
};

export type FinanceReportDataset = {
  financialYearId: string;
  reportType: InternalReportType;
  report: InternalReportDataset;
  presentation?: {
    institution: ReportInstitutionIdentity | null;
    template: ReturnType<typeof createReportTemplatePresentation>;
    emission: ReportEmissionMetadata | null;
  };
};

export function createFinanceReportDataset(
  financialYear: { id: string; year: number },
  reportType: InternalReportType,
  report: InternalReportDataset,
): FinanceReportDataset {
  return { financialYearId: financialYear.id, reportType, report };
}

export const financeInternalReportDefinition: ReportDefinition<FinanceReportInput, FinanceReportDataset> = {
  key: financeInternalReportKey,
  moduleCode: "FINANCEIRO",
  async createDataset(context, input) {
    const financialYear = await context.prisma.financialYear.findUnique({
      where: { id: input.financialYearId },
      select: { id: true, year: true },
    });
    if (!financialYear) {
      const { AccessError } = await import("@/lib/platform/tenant-context");
      throw new AccessError("Exercício financeiro não encontrado.", 404);
    }

    const [report, institution, storedTemplate] = await Promise.all([
      generateInternalReportDataset(
        context.prisma,
        input.reportType,
        financialYear.id,
        financialYear.year,
        { month: input.month },
      ),
      context.prisma.institution.findFirst({
        select: { name: true, legalName: true, cnpj: true, address: true, city: true, state: true },
        orderBy: { createdAt: "asc" },
      }),
      context.prisma.reportTemplate.findUnique({
        where: { scope: "GLOBAL" },
        select: { version: true, fingerprint: true, header: true, footer: true, orientation: true, includeEmissionMetadata: true },
      }),
    ]);
    const template = createReportTemplatePresentation(storedTemplate);
    return {
      ...createFinanceReportDataset(financialYear, input.reportType, report),
      presentation: {
        institution,
        template,
        emission: template.includeEmissionMetadata ? { issuedAt: new Date().toISOString(), issuedBy: context.user.name } : null,
      },
    };
  },
  auditTarget() {
    return {
      targetType: "REPORT_DEFINITION",
      targetId: financeInternalReportKey,
    };
  },
};
