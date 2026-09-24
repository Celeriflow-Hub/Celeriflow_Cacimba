"use server";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { tributarioBi } from "@/lib/tributacao/s9-service";
export async function loadBiAction(filters: { year?: number; taxName?: string; debtStatus?: string }) {
  try {
    const c = await getTenantContextForModuleOperation("TRIBUTACAO", "issueReports");
    const bi = await tributarioBi(c.prisma, { year: filters.year, taxName: filters.taxName || undefined, debtStatus: filters.debtStatus || undefined });
    return { bi };
  } catch (e) {
    return { bi: undefined as never, error: e instanceof Error ? e.message : "Não foi possível carregar o BI." };
  }
}
