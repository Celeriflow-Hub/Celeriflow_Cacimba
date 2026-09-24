import { NextRequest, NextResponse } from "next/server";
import { financialReportFilename } from "@/lib/financeiro/report-delivery";
import { getFile } from "@/lib/platform/blob";
import { prisma } from "@/lib/prisma";
import { getPublicFinancialReportSnapshot, isPublicFinancialReportType } from "@/lib/transparencia/portal-public";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const year = Number(request.nextUrl.searchParams.get("year"));
  const reportType = request.nextUrl.searchParams.get("reportType");
  const rawVersion = request.nextUrl.searchParams.get("version");
  const version = rawVersion ? Number(rawVersion) : undefined;
  if (!Number.isSafeInteger(year) || year < 2000 || year > 2100 || !isPublicFinancialReportType(reportType) || (version !== undefined && (!Number.isSafeInteger(version) || version < 1))) {
    return NextResponse.json({ error: "Informe exercício, tipo de relatório e versão válidos." }, { status: 400 });
  }

  try {
    const snapshot = await getPublicFinancialReportSnapshot(prisma, { year, reportType, version });
    if (!snapshot) return NextResponse.json({ error: "Relatório público não encontrado." }, { status: 404 });
    const file = await getFile(snapshot.fileUrl);
    if (!file?.stream) return NextResponse.json({ error: "Snapshot do relatório não está disponível." }, { status: 404 });
    return new NextResponse(file.stream, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${financialReportFilename(reportType, year)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Erro ao consultar relatório público:", error);
    return NextResponse.json({ error: "Não foi possível consultar o relatório público." }, { status: 500 });
  }
}
