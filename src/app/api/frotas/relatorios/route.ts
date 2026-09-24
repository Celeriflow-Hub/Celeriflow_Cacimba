import { z } from "zod";
import { AccessError } from "@/lib/platform/tenant-context";
import { fleetQuerySchema } from "@/lib/frotas/contract";
import { FleetError } from "@/lib/frotas/service";
import { issueFleetReport } from "@/lib/frotas/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const format = z.enum(["pdf", "xlsx", "csv", "txt", "print"]).parse(params.get("format") || "pdf");
    const query = fleetQuerySchema.parse(Object.fromEntries(params.entries()));
    const documentType = z.enum(["plan", "order"]).optional().parse(params.get("documentType") || undefined);
    const result = await issueFleetReport({ query, documentType, documentId: params.get("documentId") || undefined }, format);
    const filename = `celeriflow-frotas-${documentType || (query.area === "relatorios" ? query.report : query.area)}.${format === "print" ? "html" : format}`;
    return new Response(typeof result.body === "string" ? result.body : new Blob([result.body as Uint8Array<ArrayBuffer>]), { headers: { "Content-Type": result.contentType, "Content-Disposition": `${format === "print" ? "inline" : "attachment"}; filename="${filename}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return Response.json({ error: error instanceof AccessError || error instanceof FleetError ? error.message : error instanceof z.ZodError ? error.issues.map(i => i.message).join(" ") : "Não foi possível emitir o relatório." }, { status: error instanceof AccessError ? error.status : error instanceof FleetError || error instanceof z.ZodError ? 400 : 500 }); }
}
