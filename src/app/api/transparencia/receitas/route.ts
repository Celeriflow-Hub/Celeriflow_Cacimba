import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exportPublicDataCSV, getPublicRevenues, parsePublicDataFilter } from "@/lib/transparencia/portal-fiscal";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get("format");
    if (format && format !== "csv") {
      return NextResponse.json({ error: "Parâmetro format inválido." }, { status: 400 });
    }
    const revenues = await getPublicRevenues(prisma, parsePublicDataFilter(request.nextUrl.searchParams));
    if (format === "csv") {
      return new NextResponse(exportPublicDataCSV(revenues.data), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=receitas-publicas.csv",
          "Cache-Control": "no-store",
        },
      });
    }
    return NextResponse.json({
      entity: "Prefeitura Municipal de Lagoa Seca/PB",
      updatedAt: revenues.updatedAt?.toISOString() ?? null,
      total: revenues.total,
      page: revenues.page,
      pageSize: revenues.pageSize,
      data: revenues.data,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Parâmetro")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao consultar receitas públicas." }, { status: 500 });
  }
}
