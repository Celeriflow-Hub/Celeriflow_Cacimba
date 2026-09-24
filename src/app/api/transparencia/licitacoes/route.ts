import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exportPublicDataCSV } from "@/lib/transparencia/portal-fiscal";
import { getPublicBiddings } from "@/lib/transparencia/portal-public";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");
  if (format && format !== "csv") return NextResponse.json({ error: "Parâmetro format inválido." }, { status: 400 });
  try {
    const data = await getPublicBiddings(prisma);
    if (format === "csv") {
      return new NextResponse(exportPublicDataCSV(data), {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=licitacoes-publicas.csv", "Cache-Control": "no-store" },
      });
    }
    return NextResponse.json({ total: data.length, data });
  } catch (error) {
    console.error("Erro ao consultar licitações públicas:", error);
    return NextResponse.json({ error: "Não foi possível consultar licitações públicas." }, { status: 500 });
  }
}
