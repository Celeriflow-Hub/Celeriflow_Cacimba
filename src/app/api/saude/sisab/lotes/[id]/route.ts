import { NextRequest, NextResponse } from "next/server";
import { AccessError, getTenantContextForModule } from "@/lib/platform/tenant-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getTenantContextForModule("SAUDE");
    const { prisma } = await getTenantContextForModule("SAUDE");
    const { id } = await params;
    const batch = await prisma.healthEsusBatch.findUnique({ where: { id } });
    if (!batch) return NextResponse.json({ error: "Lote não encontrado." }, { status: 404 });
    return new NextResponse(batch.fileContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="SISAB_${batch.competence}.txt"`,
        "X-File-Hash": batch.hash,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Não foi possível baixar o lote." }, { status: 500 });
  }
}
