import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ensureTributarioS4Defaults } from "@/lib/tributacao/s4-service";
import NfseClient from "./NfseClient";
export const dynamic = "force-dynamic";
export default async function NfsePage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const defaults = await ensureTributarioS4Defaults(prisma);
  const [rawInvoices, rawTaxpayers, registrations, credentials, events, rpsBatches, dms, occasional, credits] = await Promise.all([
    prisma.invoice.findMany({ include: { provider: { include: { person: true, company: true } }, taker: { include: { person: true, company: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.taxpayer.findMany({ where: { status: "Ativo" }, include: { person: true, company: true }, orderBy: { createdAt: "asc" } }),
    prisma.economicRegistration.findMany({ where: { status: "Ativo" }, orderBy: { municipalInsc: "asc" } }),
    prisma.nfseCredentialRequest.findMany({ include: { events: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.nfseEvent.findMany({ orderBy: { createdAt: "desc" }, take: 400 }),
    prisma.nfseRpsBatch.findMany({ include: { items: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.nfseDmsDeclaration.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.nfseOccasionalRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.nfseDeductionCredit.findMany({ include: { consumptions: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  const fiscalRows = await prisma.nfseInvoiceData.findMany({ where: { invoiceId: { in: rawInvoices.map((row) => row.id) } } });
  const fiscalMap = new Map(fiscalRows.map((row) => [row.invoiceId, row]));
  const taxpayers = rawTaxpayers.map((row) => ({ id: row.id, name: row.company?.corporateName ?? row.person?.fullName ?? row.id, document: row.company?.cnpj ?? row.person?.cpf ?? "" }));
  const nameMap = new Map(taxpayers.map((row) => [row.id, row.name]));
  const invoices = rawInvoices.map((row) => { const fiscal = fiscalMap.get(row.id); return { id: row.id, invoiceNumber: row.invoiceNumber, verificationCode: row.verificationCode, serviceValue: Number(row.serviceValueDecimal ?? row.serviceValue), deductions: Number(row.deductionsDecimal ?? row.deductions), issValue: Number(row.issValueDecimal ?? row.issValue), ownIss: Number(fiscal?.ownIssDecimal ?? 0), retainedIss: Number(fiscal?.retainedIssDecimal ?? 0), competence: row.competence, status: row.status, providerId: row.providerId, providerName: row.provider.company?.corporateName ?? row.provider.person?.fullName ?? row.providerId, takerName: row.taker?.company?.corporateName ?? row.taker?.person?.fullName ?? "—", description: fiscal?.serviceDescription ?? "Registro anterior", economicRegistrationId: fiscal?.economicRegistrationId ?? "", activityId: fiscal?.serviceActivityId ?? defaults.activity.id, createdAt: row.createdAt.toISOString() }; });
  return <NfseClient data={{
    invoices, taxpayers,
    registrations: registrations.map((row) => ({ id: row.id, taxpayerId: row.taxpayerId, municipalInsc: row.municipalInsc, cnae: row.primaryCnae ?? "", name: nameMap.get(row.taxpayerId) ?? row.taxpayerId })),
    activity: { id: defaults.activity.id, name: defaults.activity.name, rate: Number(defaults.activity.issRate ?? 0) },
    credentials: credentials.map((row) => ({ id: row.id, taxpayerId: row.taxpayerId, providerName: nameMap.get(row.taxpayerId) ?? row.taxpayerId, registrationId: row.economicRegistrationId, status: row.status, requestedAt: row.requestedAt.toISOString(), reason: row.decisionReason ?? "", history: row.events.map((event) => `${event.eventType}: ${event.description}`) })),
    events: events.map((row) => ({ id: row.id, invoiceId: row.invoiceId, type: row.eventType, description: row.description, createdAt: row.createdAt.toISOString() })),
    rps: rpsBatches.map((row) => ({ id: row.id, batchNumber: row.batchNumber, protocol: row.protocol, source: row.source, status: row.status, items: row.items.map((item) => ({ id: item.id, number: item.rpsNumber, status: item.status })) })),
    dms: dms.map((row) => ({ id: row.id, protocol: row.protocol, taxpayerName: nameMap.get(row.taxpayerId) ?? row.taxpayerId, competence: row.competence, direction: row.direction, channel: row.channel, status: row.status, noMovement: row.noMovement, ownIss: Number(row.ownIssDecimal), retainedIss: Number(row.retainedIssDecimal) })),
    occasional: occasional.map((row) => ({ id: row.id, requestNumber: row.requestNumber, providerName: nameMap.get(row.providerTaxpayerId) ?? row.providerTaxpayerId, providerId: row.providerTaxpayerId, status: row.status, amount: Number(row.serviceValueDecimal), tax: Number(row.taxAmountDecimal), paymentRequired: row.paymentRequired, guideId: row.guideId })),
    credits: credits.map((row) => ({ id: row.id, taxpayerId: row.taxpayerId, providerName: nameMap.get(row.taxpayerId) ?? row.taxpayerId, type: row.creditType, origin: row.originDocument, original: Number(row.originalAmountDecimal), available: Number(row.availableAmountDecimal), status: row.status })),
  }} />;
}
