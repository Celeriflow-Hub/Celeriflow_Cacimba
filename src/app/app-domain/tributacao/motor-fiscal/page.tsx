import { Prisma } from "@prisma/client";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import MotorFiscalClient from "./MotorFiscalClient";

export const dynamic = "force-dynamic";

function taxpayerName(taxpayer: { person: { fullName: string } | null; company: { corporateName: string } | null }) {
  return taxpayer.company?.corporateName ?? taxpayer.person?.fullName ?? "Contribuinte sem nome";
}

function object(value: Prisma.JsonValue) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Prisma.JsonValue> : {}; }

export default async function MotorFiscalPage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const [taxes, taxpayers, parameters, assessments, guides, events, creditEvents, credits, refunds, agreements, reconciliations, bankAccounts, revenueNatures, resourceSources, processes, documents] = await Promise.all([
    prisma.tax.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.taxpayer.findMany({ where: { status: "Ativo" }, include: { person: true, company: true, realEstates: { select: { id: true, municipalInsc: true } }, economicRegistrations: { select: { id: true, municipalInsc: true } } }, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.taxParameter.findMany({ include: { tax: true }, orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }], take: 200 }),
    prisma.taxAssessment.findMany({ include: { tax: true, taxpayer: { include: { person: true, company: true } }, guides: { include: { payments: { where: { status: "Confirmado" } } } } }, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.taxGuide.findMany({ include: { assessment: { include: { tax: true, taxpayer: { include: { person: true, company: true } } } }, payments: { where: { status: "Confirmado" } } }, orderBy: { createdAt: "desc" }, take: 300 }),
    prisma.taxIntegrationEvent.findMany({ where: { integrationCode: { in: ["FISCAL_ENGINE", "PIX_ADAPTER", "BANK_RETURN", "ACCOUNTING", "TAX_CREDIT"] } }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.taxRegistryEntry.findMany({ where: { entityType: "TAX_ASSESSMENT", category: "CREDIT_EVENT", status: "ATIVO" }, orderBy: { createdAt: "asc" } }),
    prisma.taxRegistryEntry.findMany({ where: { category: "TAX_CREDIT" }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.taxRegistryEntry.findMany({ where: { category: "REFUND_REQUEST" }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.taxRegistryEntry.findMany({ where: { entityType: "COLLECTION_AGREEMENT", category: "AGREEMENT", status: "ATIVO" }, orderBy: { title: "asc" } }),
    prisma.taxRegistryEntry.findMany({ where: { category: "RECONCILIATION" }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.bankAccount.findMany({ where: { isActive: true }, orderBy: { bankName: "asc" }, select: { id: true, bankName: true, agency: true, accountNumber: true } }),
    prisma.revenueNature.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.resourceSource.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.process.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, protocolNumber: true } }),
    prisma.document.findMany({ where: { status: "Válido" }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, title: true } }),
  ]);
  const assessmentRows = assessments.map((assessment) => {
    const total = Number(assessment.finalValueDecimal ?? assessment.originalValueDecimal ?? assessment.originalValue);
    const paid = assessment.guides.flatMap((guide) => guide.payments).reduce((sum, payment) => sum + Number(payment.amountPaidDecimal ?? payment.amountPaid), 0);
    const extinct = creditEvents.filter((entry) => entry.entityId === assessment.id).reduce((sum, entry) => { const data = object(entry.data); return ["EXTINCAO_NAO_FINANCEIRA", "COMPENSACAO"].includes(String(data.eventType)) ? sum + Number(data.amount ?? 0) : sum; }, 0);
    return { id: assessment.id, number: assessment.assessmentNumber ?? assessment.id, taxId: assessment.taxId, tax: assessment.tax.name, taxpayerId: assessment.taxpayerId, taxpayer: taxpayerName(assessment.taxpayer), year: assessment.year, competence: assessment.competence?.toISOString() ?? null, base: Number(assessment.taxableBaseDecimal ?? 0), principal: Number(assessment.originalValueDecimal ?? assessment.originalValue), correction: Number(assessment.correctionValueDecimal ?? 0), interest: Number(assessment.interestValueDecimal ?? 0), penalty: Number(assessment.penaltyValueDecimal ?? 0), total, paid, balance: Math.max(total - paid - extinct, 0), status: assessment.status, realEstateId: assessment.realEstateId, economicRegistrationId: assessment.economicRegistrationId };
  });
  return <MotorFiscalClient
    taxes={taxes.map((item) => ({ id: item.id, name: item.name }))}
    taxpayers={taxpayers.map((item) => ({ id: item.id, name: taxpayerName(item), realEstates: item.realEstates, registrations: item.economicRegistrations }))}
    parameters={parameters.map((item) => ({ id: item.id, taxId: item.taxId, tax: item.tax.name, code: item.code, name: item.name, type: item.calculationType, configuration: item.configuration, effectiveFrom: item.effectiveFrom.toISOString(), effectiveUntil: item.effectiveUntil?.toISOString() ?? null, active: item.isActive }))}
    assessments={assessmentRows}
    guides={guides.map((guide) => { const total = Number(guide.totalValueDecimal ?? guide.totalValue); const paid = guide.payments.reduce((sum, payment) => sum + Number(payment.amountPaidDecimal ?? payment.amountPaid), 0); return { id: guide.id, number: guide.guideNumber ?? guide.id, assessmentId: guide.assessmentId, assessmentNumber: guide.assessment.assessmentNumber ?? guide.assessmentId, tax: guide.assessment.tax.name, taxpayer: taxpayerName(guide.assessment.taxpayer), total, paid, balance: Math.max(total - paid, 0), dueDate: guide.dueDate.toISOString(), status: guide.status }; })}
    events={events.map((event) => ({ id: event.id, integration: event.integrationCode, type: event.eventType, key: event.idempotencyKey, status: event.status, reference: event.externalReference, result: event.result, date: event.createdAt.toISOString() }))}
    credits={credits.map((entry) => ({ id: entry.id, taxpayerId: entry.entityId, title: entry.title, status: entry.status, data: object(entry.data), date: entry.createdAt.toISOString() }))}
    refunds={refunds.map((entry) => ({ id: entry.id, taxpayerId: entry.entityId, title: entry.title, status: entry.status, data: object(entry.data), date: entry.createdAt.toISOString() }))}
    agreements={agreements.map((entry) => ({ id: entry.id, code: entry.entityId, name: entry.title, data: object(entry.data) }))}
    reconciliations={reconciliations.map((entry) => ({ id: entry.id, agreementId: entry.entityId, title: entry.title, status: entry.status, data: object(entry.data), date: entry.createdAt.toISOString() }))}
    bankAccounts={bankAccounts.map((item) => ({ id: item.id, label: `${item.bankName} · ${item.agency}/${item.accountNumber}` }))}
    revenueNatures={revenueNatures.map((item) => ({ id: item.id, label: `${item.code} · ${item.name}` }))}
    resourceSources={resourceSources.map((item) => ({ id: item.id, label: `${item.code} · ${item.name}` }))}
    processes={processes}
    documents={documents}
  />;
}
