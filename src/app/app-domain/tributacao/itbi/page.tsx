import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ensureTributarioS3Defaults } from "@/lib/tributacao/s3-service";
import ItbiClient from "./ItbiClient";

export const dynamic = "force-dynamic";

function taxpayerName(item: { person: { fullName: string; cpf: string } | null; company: { corporateName: string; cnpj: string } | null }) {
  return item.company ? `${item.company.corporateName} · ${item.company.cnpj}` : item.person ? `${item.person.fullName} · ${item.person.cpf}` : "Contribuinte sem identificação";
}

export default async function ItbiPage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  await ensureTributarioS3Defaults(prisma);
  const [types, properties, taxpayers, processes, declarations] = await Promise.all([
    prisma.itbiTransactionType.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.realEstate.findMany({ orderBy: { municipalInsc: "asc" }, take: 500 }),
    prisma.taxpayer.findMany({ where: { status: "Ativo" }, include: { person: true, company: true }, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.process.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, protocolNumber: true, status: true }, take: 200 }),
    prisma.itbiDeclaration.findMany({ include: { transactionType: true, parties: true, events: { orderBy: { createdAt: "desc" }, take: 20 } }, orderBy: { createdAt: "desc" }, take: 300 }),
  ]);
  const names = new Map(taxpayers.map((item) => [item.id, taxpayerName(item)]));
  return <ItbiClient
    transactionTypes={types.map((item) => ({ id: item.id, code: item.code, name: item.name, rate: Number(item.rate), damStage: item.damStage, updateMode: item.cadastralUpdateMode }))}
    properties={properties.map((item) => ({ id: item.id, label: `${item.municipalInsc ?? "Sem inscrição"} · ${item.streetName ?? "Endereço não informado"}, ${item.number ?? "s/n"}`, taxpayerId: item.taxpayerId }))}
    taxpayers={taxpayers.map((item) => ({ id: item.id, name: names.get(item.id) ?? item.id }))}
    processes={processes}
    declarations={declarations.map((item) => ({
      id: item.id, number: item.declarationNumber, status: item.status, type: item.transactionType.name, protocol: item.protocolNumber,
      propertyId: item.realEstateId, scope: item.transmissionScope, fraction: Number(item.transmittedFraction), propertyValue: Number(item.declaredPropertyValue),
      base: Number(item.taxableBase), rate: Number(item.appliedRate), tax: Number(item.taxAmount), taxDebt: Number(item.blockingTaxDebt), nonTaxDebt: Number(item.nonTaxDebtAmount),
      isLeasehold: item.isLeasehold, registryOffice: item.registryOffice, guideId: item.guideId, documentId: item.documentId,
      parties: item.parties.map((party) => ({ role: party.role, name: names.get(party.taxpayerId) ?? party.taxpayerId, share: party.participationPercent ? Number(party.participationPercent) : null, liability: party.liabilityType })),
      events: item.events.map((event) => ({ type: event.eventType, description: event.description, date: event.createdAt.toISOString() })),
    }))}
  />;
}
