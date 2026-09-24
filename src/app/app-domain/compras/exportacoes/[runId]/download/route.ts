import { NextResponse } from "next/server";
import { z } from "zod";
import { getProcurementExportDownload, ProcurementExportError } from "@/lib/integrations/procurement-exports";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;
    const context = await getTenantContextForModuleOperation("COMPRAS", "issueReports");
    const download = await getProcurementExportDownload(context.prisma, z.string().min(1).max(191).parse(runId), context.user.id);
    return new Response(download.content, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${download.filename}"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ProcurementExportError || error instanceof z.ZodError) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Pacote de exportacao invalido." }, { status: 400 });
    }
    console.error("Erro ao baixar pacote de exportacao de Compras:", error);
    return NextResponse.json({ error: "Nao foi possivel baixar o pacote de exportacao." }, { status: 500 });
  }
}
