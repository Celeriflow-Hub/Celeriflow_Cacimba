import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exportPublicDataCSV, getPublicExpenses, parsePublicDataFilter } from "@/lib/transparencia/portal-fiscal";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get("format");
    if (format && format !== "csv") {
      return NextResponse.json({ error: "Parâmetro format inválido." }, { status: 400 });
    }
    const expenses = await getPublicExpenses(prisma, parsePublicDataFilter(request.nextUrl.searchParams));
    if (format === "csv") {
      return new NextResponse(exportPublicDataCSV(expenses.data), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=despesas-publicas.csv",
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json({
      entity: "Prefeitura Municipal de Lagoa Seca/PB",
      updatedAt: expenses.updatedAt?.toISOString() ?? null,
      total: expenses.total,
      page: expenses.page,
      pageSize: expenses.pageSize,
      data: expenses.data,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Parâmetro")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao consultar despesas públicas." }, { status: 500 });
  }
}
