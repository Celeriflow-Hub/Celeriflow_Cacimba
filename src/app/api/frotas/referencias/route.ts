import { AccessError, getTenantContextForModule } from "@/lib/platform/tenant-context";
import { fleetReferences } from "@/lib/frotas/queries";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const context = await getTenantContextForModule("FROTAS");
    const options = await fleetReferences(context, params.get("kind") || "units", params.get("q") || "", params.get("unitId") || "");
    return Response.json({ options }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return Response.json({ error: error instanceof AccessError ? error.message : "Não foi possível consultar as referências." }, { status: error instanceof AccessError ? error.status : 500 }); }
}
