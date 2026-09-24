import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import RegistrySourcesClient from "./RegistrySourcesClient";

export const dynamic = "force-dynamic";

export default async function RegistrySourcesPage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const events = await prisma.taxIntegrationEvent.findMany({ where: { integrationCode: { in: ["SERPRO_CPF", "SERPRO_CNPJ", "CORREIOS_DNE"] } }, orderBy: { createdAt: "desc" }, take: 200 });
  return <RegistrySourcesClient events={events.map((event) => ({ id: event.id, source: event.integrationCode, status: event.status, evidenceLevel: event.evidenceLevel, payload: event.payload, createdAt: event.createdAt.toISOString() }))} />;
}
