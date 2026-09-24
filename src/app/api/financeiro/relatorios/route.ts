import { NextRequest, NextResponse } from "next/server";
import { financialReportFilename, isFinancialReportType, isReportMonth, reportRequiresMonth } from "@/lib/financeiro/report-delivery";
import { generateReportPdf } from "@/lib/financeiro/report-export";
import type { FinanceReportDataset, FinanceReportInput } from "@/lib/financeiro/report-definition";
import { AccessError } from "@/lib/platform/tenant-context";
import { executeReport, isReportFormat, renderReport, writeReportIssuanceAudit, type ReportFormat, type ReportRenderer } from "@/lib/reports/report-engine";
import { getRegisteredReportDefinition } from "@/lib/reports/registry";
import { createDefaultReportTemplate } from "@/lib/reports/report-template";
import { renderTabularCsv, renderTabularPrintHtml, renderTabularTxt, renderTabularXlsx } from "@/lib/reports/tabular-renderers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FinanceRenderedReport = {
  body: string | Uint8Array;
  contentType: string;
  filename: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const financialYearId = request.nextUrl.searchParams.get("financialYearId");
    const reportType = request.nextUrl.searchParams.get("reportType");
    const formatParameter = request.nextUrl.searchParams.get("format") ?? "CSV";
    const format = formatParameter.toLowerCase();
    if (!financialYearId || !isFinancialReportType(reportType) || !isReportFormat(format)) {
      return NextResponse.json({ error: "Selecione um exercício, tipo de relatório e formato válidos." }, { status: 400 });
    }
    const monthParameter = request.nextUrl.searchParams.get("month");
    const month = monthParameter === null || monthParameter === "" ? undefined : Number(monthParameter);
    if ((reportRequiresMonth(reportType) && !isReportMonth(month ?? null)) || (month !== undefined && !isReportMonth(month))) {
      return NextResponse.json({ error: "Informe um mês válido para o relatório selecionado." }, { status: 400 });
    }

    const execution = await executeReport<FinanceReportInput, FinanceReportDataset>(
      getRegisteredReportDefinition("finance.internal"),
      { financialYearId, reportType, month },
      format,
    );
    const dataset = execution.dataset.report;
    if (format === "preview") {
      return NextResponse.json({ reportKey: execution.key, format, dataset }, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const presentation = execution.dataset.presentation ?? { institution: null, template: createDefaultReportTemplate(), emission: null };
    const renderers: Partial<Record<ReportFormat, ReportRenderer<FinanceReportInput, FinanceReportDataset, FinanceRenderedReport>>> = {
      csv: (current) => ({ body: renderTabularCsv(current.dataset.report, presentation), contentType: "text/csv; charset=utf-8", filename: financialReportFilename(reportType, dataset.year, "CSV") }),
      pdf: async (current) => ({ body: await generateReportPdf(current.dataset.report, presentation), contentType: "application/pdf", filename: financialReportFilename(reportType, dataset.year, "PDF") }),
      xlsx: async (current) => ({ body: await renderTabularXlsx(current.dataset.report, presentation), contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename: financialReportFilename(reportType, dataset.year, "XLSX") }),
      txt: (current) => ({ body: renderTabularTxt(current.dataset.report, presentation), contentType: "text/plain; charset=utf-8", filename: financialReportFilename(reportType, dataset.year, "TXT") }),
      print: (current) => ({ body: renderTabularPrintHtml(current.dataset.report, presentation), contentType: "text/html; charset=utf-8", filename: null }),
    };
    const rendered = await renderReport(execution, renderers);
    await writeReportIssuanceAudit(execution);

    return new NextResponse(rendered.body as unknown as BodyInit, {
      headers: {
        "Content-Type": rendered.contentType,
        ...(rendered.filename ? { "Content-Disposition": `attachment; filename="${rendered.filename}"` } : {}),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Erro ao emitir relatório financeiro:", error);
    return NextResponse.json({ error: "Não foi possível emitir o relatório financeiro." }, { status: 500 });
  }
}
