import { NextRequest, NextResponse } from "next/server";
import { AccessError, assertHealthUnitAccess, getTenantContextForModule } from "@/lib/platform/tenant-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await getTenantContextForModule("SAUDE");
    const { id } = await params;
    const file = await context.prisma.healthSusFile.findUnique({ where: { id }, include: { competence: { select: { period: true } } } });
    if (!file) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
    if (file.unitId) assertHealthUnitAccess(context.user, file.unitId);
    const filename = `${file.fileType}_${file.competence.period}.txt`;
    return new NextResponse(file.content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-File-Hash": file.hash,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Não foi possível baixar o arquivo." }, { status: 500 });
  }
}
