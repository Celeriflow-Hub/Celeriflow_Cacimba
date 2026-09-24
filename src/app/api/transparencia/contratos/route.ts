import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exportPublicDataCSV } from "@/lib/transparencia/portal-fiscal";
import { getPublicContracts } from "@/lib/transparencia/portal-public";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");
  if (format && format !== "csv") return NextResponse.json({ error: "Parâmetro format inválido." }, { status: 400 });
  try {
    const data = await getPublicContracts(prisma);
    if (format === "csv") {
      return new NextResponse(exportPublicDataCSV(data.map((contract) => ({ ...contract, supplierName: contract.supplier.name, supplierDocumentMasked: contract.supplier.documentMasked }))), {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=contratos-publicos.csv", "Cache-Control": "no-store" },
      });
    }
    return NextResponse.json({ total: data.length, data });
  } catch (error) {
    console.error("Erro ao consultar contratos públicos:", error);
    return NextResponse.json({ error: "Não foi possível consultar contratos públicos." }, { status: 500 });
  }
}
