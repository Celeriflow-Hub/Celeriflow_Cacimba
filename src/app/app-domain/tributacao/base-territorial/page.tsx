import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import TerritorialBaseClient from "./TerritorialBaseClient";

export const dynamic = "force-dynamic";

export default async function TerritorialBasePage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const entries = await prisma.taxRegistryEntry.findMany({ where: { entityType: "TERRITORIAL_BASE", category: { in: ["SETOR", "FACE", "FAIXA"] } }, orderBy: [{ category: "asc" }, { entityId: "asc" }, { version: "desc" }] });
  return <TerritorialBaseClient entries={entries.map((entry) => ({ id: entry.id, code: entry.entityId, recordType: entry.category, data: entry.data, version: entry.version, effectiveFrom: entry.effectiveFrom.toISOString(), status: entry.status }))} />;
}
