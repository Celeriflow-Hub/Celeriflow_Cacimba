import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ensureTributarioS3Defaults } from "@/lib/tributacao/s3-service";
import DteClient from "./DteClient";

export const dynamic = "force-dynamic";
function name(item: { person: { fullName: string; cpf: string } | null; company: { corporateName: string; cnpj: string } | null }) { return item.company ? `${item.company.corporateName} · ${item.company.cnpj}` : item.person ? `${item.person.fullName} · ${item.person.cpf}` : "Contribuinte sem identificação"; }

export default async function DtePage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO"); await ensureTributarioS3Defaults(prisma);
  const [taxpayers, mailboxes, categories, messages, powers, processes, documents, accessGrants] = await Promise.all([
    prisma.taxpayer.findMany({ where: { status: "Ativo" }, include: { person: true, company: true }, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.dteMailbox.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.dteCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.dteMessage.findMany({ include: { category: true, events: { orderBy: { createdAt: "desc" } } }, orderBy: { availableAt: "desc" }, take: 500 }),
    prisma.dtePowerOfAttorney.findMany({ include: { events: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.process.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, protocolNumber: true }, take: 200 }),
    prisma.document.findMany({ where: { status: { in: ["Válido", "Pendente"] } }, include: { signatures: { orderBy: { requestedAt: "desc" } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.dteAccessGrant.findMany({ include: { mailbox: true }, orderBy: { createdAt: "desc" }, take: 200 }),
  ]);
  const names = new Map(taxpayers.map((item) => [item.id, name(item)])); const boxes = new Map(mailboxes.map((item) => [item.id, item])); const documentMap = new Map(documents.map((item) => [item.id, item]));
  return <DteClient
    taxpayers={taxpayers.map((item) => ({ id: item.id, name: names.get(item.id) ?? item.id, cnpj: item.company?.cnpj ?? null }))}
    mailboxes={mailboxes.map((item) => ({ id: item.id, taxpayerId: item.taxpayerId, owner: names.get(item.taxpayerId) ?? item.taxpayerId, cnpj: item.establishmentCnpj, status: item.status, email: item.emailNoticeEnabled, sms: item.smsNoticeEnabled }))}
    categories={categories.map((item) => ({ id: item.id, name: item.name, retention: item.retentionRequired, deadlineDays: item.defaultDeadlineDays }))}
    messages={messages.map((item) => { const document = item.documentId ? documentMap.get(item.documentId) : undefined; const pending = document?.signatures.filter((signature) => !signature.signedAt && !signature.rejectedAt).length ?? 0; const signed = document?.signatures.filter((signature) => Boolean(signature.signedAt)).length ?? 0; return { id: item.id, mailbox: boxes.get(item.mailboxId)?.establishmentCnpj ?? names.get(boxes.get(item.mailboxId)?.taxpayerId ?? "") ?? item.mailboxId, category: item.category.name, subject: item.subject, body: item.body, status: item.status, availableAt: item.availableAt.toISOString(), deadlineAt: item.deadlineAt?.toISOString() ?? null, readAt: item.readAt?.toISOString() ?? null, acknowledgedAt: item.acknowledgedAt?.toISOString() ?? null, tacitAt: item.tacitAcknowledgedAt?.toISOString() ?? null, emailNoticeAt: item.emailNoticeAt?.toISOString() ?? null, smsNoticeAt: item.smsNoticeAt?.toISOString() ?? null, documentId: item.documentId, signatureRequired: item.signatureRequired, signatureStatus: item.signatureRequired ? pending > 0 ? "PENDENTE" : signed > 0 ? "ASSINADO" : item.signatureStatus : null, retention: item.category.retentionRequired, events: [...item.events.map((event) => ({ type: event.eventType, description: event.description, date: event.createdAt.toISOString() })), ...(document?.signatures.map((signature) => ({ type: signature.signedAt ? "DOCUMENTO_ASSINADO" : signature.rejectedAt ? "ASSINATURA_RECUSADA" : "ASSINATURA_SOLICITADA", description: `${signature.signerName} · ${signature.provider}`, date: (signature.signedAt ?? signature.rejectedAt ?? signature.requestedAt).toISOString() })) ?? [])] }; })}
    powers={powers.map((item) => ({ id: item.id, grantor: names.get(item.grantorTaxpayerId) ?? item.grantorTaxpayerId, attorney: names.get(item.attorneyTaxpayerId) ?? item.attorneyTaxpayerId, cnpjs: Array.isArray(item.establishmentCnpjs) ? item.establishmentCnpjs.map(String) : [], status: item.status, legitimacy: item.legitimacyMode, officialCertificate: item.officialCertificateValidated, documentId: item.documentId, events: item.events.map((event) => ({ type: event.eventType, description: event.description, date: event.createdAt.toISOString() })) }))}
    processes={processes}
    documents={documents.map((item) => ({ id: item.id, title: item.title, url: item.fileUrl, pendingSignatures: item.signatures.filter((signature) => !signature.signedAt && !signature.rejectedAt).length, signedSignatures: item.signatures.filter((signature) => Boolean(signature.signedAt)).length }))}
    accessGrants={accessGrants.map((item) => ({ id: item.id, mailbox: item.mailbox.establishmentCnpj ?? names.get(item.mailbox.taxpayerId) ?? item.mailboxId, authorized: names.get(item.authorizedTaxpayerId) ?? item.authorizedTaxpayerId, last4: item.codeLast4, status: item.status, validUntil: item.validUntil.toISOString(), revokedAt: item.revokedAt?.toISOString() ?? null }))}
  />;
}
