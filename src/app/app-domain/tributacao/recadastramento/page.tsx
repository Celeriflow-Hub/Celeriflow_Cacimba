import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import RecadastramentoClient from "./RecadastramentoClient";

export const dynamic = "force-dynamic";

export default async function RecadastramentoPage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const [configs, requests, properties] = await Promise.all([
    prisma.taxRegistryEntry.findMany({ where: { entityType: "RECADASTRAMENTO_CAMPAIGN", category: "CAMPOS_PERMITIDOS" }, orderBy: { createdAt: "desc" } }),
    prisma.taxRegistryEntry.findMany({ where: { entityType: "REAL_ESTATE", category: "PEDIDO_ALTERACAO", source: "CONTRIBUINTE" }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.realEstate.findMany({ orderBy: { municipalInsc: "asc" }, select: { id: true, municipalInsc: true, registration: true, streetName: true } }),
  ]);
  return <RecadastramentoClient campaigns={configs.map((item) => ({ id: item.id, code: item.entityId, title: item.title, data: item.data, startsAt: item.effectiveFrom.toISOString(), endsAt: item.effectiveUntil?.toISOString() ?? null, status: item.status }))} requests={requests.map((item) => ({ id: item.id, estateId: item.entityId, title: item.title, data: item.data, status: item.status, createdAt: item.createdAt.toISOString() }))} properties={properties.map((item) => ({ id: item.id, label: item.municipalInsc ?? item.registration ?? item.streetName ?? item.id }))} />;
}
