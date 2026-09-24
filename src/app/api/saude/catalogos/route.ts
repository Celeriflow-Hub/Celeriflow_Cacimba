import { NextRequest, NextResponse } from "next/server";
import { AccessError, getTenantContextForModule } from "@/lib/platform/tenant-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const context = await getTenantContextForModule("SAUDE");
    const type = request.nextUrl.searchParams.get("type");
    const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 120) || "";
    if (!query || !["cid", "procedure"].includes(type || "")) return NextResponse.json({ items: [] });
    const where = { isCurrent: true, isActive: true, OR: [{ code: { contains: query, mode: "insensitive" as const } }, { description: { contains: query, mode: "insensitive" as const } }] };
    const items = type === "cid"
      ? await context.prisma.healthSusReference.findMany({ where: { ...where, kind: "CID" }, orderBy: { code: "asc" }, take: 20, select: { id: true, code: true, description: true } })
      : await context.prisma.healthSusProcedure.findMany({ where, orderBy: { code: "asc" }, take: 20, select: { id: true, code: true, description: true } });
    return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Não foi possível pesquisar o catálogo SUS." }, { status: 500 });
  }
}
