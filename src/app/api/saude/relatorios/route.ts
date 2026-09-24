import { NextRequest, NextResponse } from "next/server";
import { AccessError } from "@/lib/platform/tenant-context";
import { executeReport, isReportFormat, renderReport, writeReportIssuanceAudit, type ReportFormat, type ReportRenderer } from "@/lib/reports/report-engine";
import { renderTabularCsv, renderTabularPrintHtml, renderTabularTxt, renderTabularXlsx } from "@/lib/reports/tabular-renderers";
import { generateReportPdf } from "@/lib/financeiro/report-export";
import { isHealthAdministrativeReportType } from "@/lib/saude/health-report-catalog";
import { healthAdministrativeReportDefinition, healthReportFilename, type HealthReportDataset, type HealthReportInput } from "@/lib/saude/health-report-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Rendered = { body: string | Uint8Array; contentType: string; filename: string | null };

function optional(search: URLSearchParams, name: string, max = 120) {
  return search.get(name)?.trim().slice(0, max) || undefined;
}

export async function GET(request: NextRequest) {
  try {
    const reportType = request.nextUrl.searchParams.get("reportType");
    const formatValue = (request.nextUrl.searchParams.get("format") || "preview").toLowerCase();
    if (!isHealthAdministrativeReportType(reportType) || !isReportFormat(formatValue)) return NextResponse.json({ error: "Selecione um relatório e formato válidos." }, { status: 400 });
    const input: HealthReportInput = {
      reportType,
      from: optional(request.nextUrl.searchParams, "from", 10),
      to: optional(request.nextUrl.searchParams, "to", 10),
      unitId: optional(request.nextUrl.searchParams, "unitId", 64),
      professionalId: optional(request.nextUrl.searchParams, "professionalId", 64),
      specialtyId: optional(request.nextUrl.searchParams, "specialtyId", 64),
      teamId: optional(request.nextUrl.searchParams, "teamId", 64),
      municipality: optional(request.nextUrl.searchParams, "municipality"),
      status: optional(request.nextUrl.searchParams, "status", 40),
      cid: optional(request.nextUrl.searchParams, "cid"),
      procedure: optional(request.nextUrl.searchParams, "procedure"),
      financing: optional(request.nextUrl.searchParams, "financing"),
      covenant: optional(request.nextUrl.searchParams, "covenant"),
      query: optional(request.nextUrl.searchParams, "query"),
      recordId: optional(request.nextUrl.searchParams, "recordId", 64),
    };
    const execution = await executeReport(healthAdministrativeReportDefinition, input, formatValue);
    if (formatValue === "preview") return NextResponse.json({ dataset: execution.dataset }, { headers: { "Cache-Control": "private, no-store" } });

    const { report, presentation } = execution.dataset;
    const renderers: Partial<Record<ReportFormat, ReportRenderer<HealthReportInput, HealthReportDataset, Rendered>>> = {
      csv: () => ({ body: `\uFEFF${renderTabularCsv(report, presentation)}`, contentType: "text/csv; charset=utf-8", filename: healthReportFilename(reportType, "csv") }),
      xlsx: async () => ({ body: await renderTabularXlsx(report, presentation), contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename: healthReportFilename(reportType, "xlsx") }),
      txt: () => ({ body: renderTabularTxt(report, presentation), contentType: "text/plain; charset=utf-8", filename: healthReportFilename(reportType, "txt") }),
      pdf: async () => ({ body: await generateReportPdf(report, presentation), contentType: "application/pdf", filename: healthReportFilename(reportType, "pdf") }),
      print: () => ({ body: renderTabularPrintHtml(report, presentation).replace("</body>", "<script>window.addEventListener('load',function(){window.print()})</script></body>"), contentType: "text/html; charset=utf-8", filename: null }),
    };
    const rendered = await renderReport(execution, renderers);
    await writeReportIssuanceAudit(execution);
    return new NextResponse(rendered.body as BodyInit, { headers: { "Content-Type": rendered.contentType, ...(rendered.filename ? { "Content-Disposition": `attachment; filename="${rendered.filename}"` } : {}), "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Erro ao emitir relatório administrativo da Saúde:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível emitir o relatório." }, { status: 500 });
  }
}
