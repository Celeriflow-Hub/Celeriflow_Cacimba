import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import RedesimClient from "./RedesimClient";

export const dynamic = "force-dynamic";

export default async function RedesimPage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const [events, taxpayers] = await Promise.all([
    prisma.taxIntegrationEvent.findMany({ where: { integrationCode: "REDESIM" }, orderBy: { receivedAt: "desc" }, take: 200 }),
    prisma.taxpayer.findMany({ where: { companyId: { not: null } }, include: { company: true, economicRegistrations: true }, orderBy: { updatedAt: "desc" } }),
  ]);
  return <RedesimClient events={events.map((event) => ({ id: event.id, eventType: event.eventType, status: event.status, evidenceLevel: event.evidenceLevel, protocol: event.protocol, externalReference: event.externalReference, taxpayerId: event.taxpayerId, economicRegistrationId: event.economicRegistrationId, receivedAt: event.receivedAt.toISOString(), result: event.result }))} taxpayers={taxpayers.map((taxpayer) => ({ id: taxpayer.id, name: taxpayer.company?.corporateName ?? "Pessoa jurídica", cnpj: taxpayer.company?.cnpj ?? "", municipalInsc: taxpayer.economicRegistrations[0]?.municipalInsc ?? "" }))} />;
}
