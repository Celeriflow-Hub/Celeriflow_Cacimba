import crypto from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient;
type Tx = Prisma.TransactionClient;

export class PriceResearchError extends Error {}

export const priceResearchStatuses = {
  inProgress: "Em Andamento",
  completed: "Concluída",
} as const;

export const priceQuoteStatuses = {
  invitationPending: "CONVITE_PENDENTE",
  draft: "CONVITE_RASCUNHO",
  submitted: "CONVITE_APRESENTADA",
  cancelled: "CONVITE_CANCELADO",
  legacyActive: "Ativa",
} as const;

export const priceReferenceMethod = "Média aritmética dos valores globais apresentados";

const mutableQuoteStatuses = [priceQuoteStatuses.invitationPending, priceQuoteStatuses.draft];

type InvitationClaims = {
  v: 1;
  i: string;
  r: string;
  s: string;
};

export type PriceComparisonQuote = {
  id: string;
  supplierId: string;
  value: number;
};

export type PriceComparison = {
  referenceValue: number | null;
  minimumValue: number | null;
  quoteIdsAtMinimum: string[];
};

function required(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) throw new PriceResearchError(`${label} é obrigatório.`);
  return normalized;
}

function invitationSecret() {
  const secret = process.env.PRICE_RESEARCH_PORTAL_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new PriceResearchError("A chave de acesso do portal de fornecedores não está configurada.");
  }

  return "celeriflow-price-research-development-secret";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function toCents(value: number) {
  return Math.round(value * 100);
}

function isValidMoney(value: number) {
  return Number.isFinite(value) && value > 0 && Number.isSafeInteger(toCents(value));
}

function normalizeMoney(value: number) {
  if (!isValidMoney(value)) throw new PriceResearchError("Informe um valor global maior que zero.");
  return toCents(value) / 100;
}

function encodeClaims(claims: InvitationClaims) {
  return Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
}

function signClaims(encodedClaims: string) {
  return crypto.createHmac("sha256", invitationSecret()).update(encodedClaims).digest("base64url");
}

function parseInvitationClaims(accessKey: string): InvitationClaims {
  const [encodedClaims, signature, extra] = accessKey.split(".");
  if (!encodedClaims || !signature || extra) throw new PriceResearchError("Chave de acesso inválida.");

  const expected = Buffer.from(signClaims(encodedClaims), "utf8");
  const received = Buffer.from(signature, "utf8");
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    throw new PriceResearchError("Chave de acesso inválida.");
  }

  try {
    const decoded = JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8")) as Partial<InvitationClaims>;
    if (decoded.v !== 1 || !decoded.i || !decoded.r || !decoded.s) throw new Error("invalid claims");
    return { v: 1, i: decoded.i, r: decoded.r, s: decoded.s };
  } catch {
    throw new PriceResearchError("Chave de acesso inválida.");
  }
}

export function createSupplierInvitationAccessKey(invitation: { id: string; researchId: string; supplierId: string }) {
  const encodedClaims = encodeClaims({ v: 1, i: invitation.id, r: invitation.researchId, s: invitation.supplierId });
  return `${encodedClaims}.${signClaims(encodedClaims)}`;
}

export function verifySupplierInvitationAccessKey(accessKey: string) {
  return parseInvitationClaims(accessKey);
}

export function isSupplierActiveForPriceResearch(status: string | null | undefined) {
  return status?.trim().toLocaleLowerCase("pt-BR") === "ativo";
}

export function isSubmittedPriceQuote(status: string) {
  return status === priceQuoteStatuses.submitted || status === priceQuoteStatuses.legacyActive;
}

export function priceQuoteStatusLabel(status: string) {
  if (status === priceQuoteStatuses.invitationPending) return "Convite pendente";
  if (status === priceQuoteStatuses.draft) return "Rascunho";
  if (isSubmittedPriceQuote(status)) return "Apresentada";
  if (status === priceQuoteStatuses.cancelled) return "Cancelada";
  return status;
}

export function calculatePriceComparison(quotes: PriceComparisonQuote[]): PriceComparison {
  const validQuotes = quotes.filter((quote) => isValidMoney(quote.value));
  if (!validQuotes.length) return { referenceValue: null, minimumValue: null, quoteIdsAtMinimum: [] };

  const valuesInCents = validQuotes.map((quote) => toCents(quote.value));
  const minimumInCents = Math.min(...valuesInCents);
  const referenceValue = valuesInCents.reduce((total, value) => total + value, 0) / valuesInCents.length / 100;

  return {
    referenceValue,
    minimumValue: minimumInCents / 100,
    quoteIdsAtMinimum: validQuotes.filter((quote) => toCents(quote.value) === minimumInCents).map((quote) => quote.id),
  };
}

export function isPriceResearchResponseOpen(
  research: { status: string; date: Date; createdAt: Date },
  now = new Date(),
) {
  // The existing model has one business-time field: date is the close instant and createdAt anchors the opening instant.
  return research.status === priceResearchStatuses.inProgress
    && now.getTime() >= research.createdAt.getTime()
    && now.getTime() < research.date.getTime();
}

function assertPriceResearchResponseOpen(research: { status: string; date: Date; createdAt: Date }, now: Date) {
  if (!isPriceResearchResponseOpen(research, now)) {
    throw new PriceResearchError("A pesquisa de preços está encerrada ou indisponível para respostas.");
  }
}

function assertFutureDeadline(deadlineAt: Date, now: Date) {
  if (!Number.isFinite(deadlineAt.getTime()) || deadlineAt.getTime() <= now.getTime()) {
    throw new PriceResearchError("Informe um prazo de encerramento futuro.");
  }
}

async function writePriceResearchLifecycleEvent(
  tx: Tx,
  input: { eventType: string; quoteId: string; researchId: string; actorUsuarioId: string; idempotencyKey: string },
) {
  await tx.procurementLifecycleEvent.create({
    data: {
      eventType: input.eventType,
      entityType: "PRICE_QUOTE",
      entityId: input.quoteId,
      sourceType: "PRICE_RESEARCH",
      sourceId: input.researchId,
      actorUsuarioId: required(input.actorUsuarioId, "Usuário responsável"),
      idempotencyKey: input.idempotencyKey,
    },
  });
}

function supplierContactEmail(supplier: { person: { email: string | null } | null; company: { emailPrimary: string | null } | null }) {
  return supplier.person?.email?.trim() || supplier.company?.emailPrimary?.trim() || null;
}

function supplierName(supplier: { person: { fullName: string } | null; company: { tradeName: string | null; corporateName: string } | null }) {
  return supplier.person?.fullName || supplier.company?.tradeName || supplier.company?.corporateName || "Fornecedor cadastrado";
}

function assertSupplierIdentity(
  supplier: { person: { email: string | null } | null; company: { emailPrimary: string | null } | null },
  authenticatedEmail: string,
) {
  const contactEmails = [supplier.person?.email, supplier.company?.emailPrimary].filter((email): email is string => Boolean(email?.trim()));
  if (!contactEmails.some((email) => normalizeEmail(email) === normalizeEmail(authenticatedEmail))) {
    throw new PriceResearchError("Acesso à cotação não autorizado.");
  }
}

export async function createPriceResearch(db: Db, input: { processId: string; deadlineAt: Date; now?: Date }) {
  const processId = required(input.processId, "Processo de compra");
  const now = input.now ?? new Date();
  assertFutureDeadline(input.deadlineAt, now);

  return db.$transaction(async (tx) => {
    const process = await tx.purchaseProcess.findUnique({
      where: { id: processId },
      select: { id: true, purchaseRequestId: true, items: { select: { id: true } } },
    });
    if (!process) throw new PriceResearchError("Processo de compra não encontrado.");
    if (!process.purchaseRequestId) throw new PriceResearchError("A pesquisa de preços exige um processo vinculado a uma solicitação de compra.");
    if (!process.items.length) throw new PriceResearchError("O processo precisa possuir itens antes da pesquisa de preços.");

    return tx.priceResearch.create({
      data: {
        processId: process.id,
        date: input.deadlineAt,
        status: priceResearchStatuses.inProgress,
      },
    });
  });
}

export async function updatePriceResearchDeadline(db: Db, input: { researchId: string; deadlineAt: Date; now?: Date }) {
  const researchId = required(input.researchId, "Pesquisa de preços");
  const now = input.now ?? new Date();
  assertFutureDeadline(input.deadlineAt, now);

  return db.$transaction(async (tx) => {
    const research = await tx.priceResearch.findUnique({ where: { id: researchId }, select: { id: true, status: true } });
    if (!research) throw new PriceResearchError("Pesquisa de preços não encontrada.");
    if (research.status !== priceResearchStatuses.inProgress) throw new PriceResearchError("Somente pesquisas em andamento podem ter o prazo alterado.");

    return tx.priceResearch.update({ where: { id: research.id }, data: { date: input.deadlineAt } });
  });
}

export async function closePriceResearch(db: Db, researchId: string) {
  const id = required(researchId, "Pesquisa de preços");
  return db.$transaction(async (tx) => {
    const research = await tx.priceResearch.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!research) throw new PriceResearchError("Pesquisa de preços não encontrada.");
    if (research.status === priceResearchStatuses.completed) return research;

    return tx.priceResearch.update({ where: { id: research.id }, data: { status: priceResearchStatuses.completed } });
  });
}

export async function deletePriceResearch(db: Db, researchId: string) {
  const id = required(researchId, "Pesquisa de preços");
  return db.$transaction(async (tx) => {
    const research = await tx.priceResearch.findUnique({
      where: { id },
      select: { id: true, _count: { select: { quotes: true } } },
    });
    if (!research) throw new PriceResearchError("Pesquisa de preços não encontrada.");
    if (research._count.quotes) throw new PriceResearchError("Pesquisas com convites ou cotações não podem ser excluídas; encerre a pesquisa para preservar o histórico.");

    await tx.priceResearch.delete({ where: { id: research.id } });
  });
}

export async function inviteSupplierToPriceResearch(db: Db, input: { researchId: string; supplierId: string; actorUsuarioId: string; now?: Date }) {
  const researchId = required(input.researchId, "Pesquisa de preços");
  const supplierId = required(input.supplierId, "Fornecedor");
  const now = input.now ?? new Date();

  return db.$transaction(async (tx) => {
    const [research, supplier] = await Promise.all([
      tx.priceResearch.findUnique({ where: { id: researchId }, select: { id: true, status: true, date: true, createdAt: true } }),
      tx.supplier.findUnique({
        where: { id: supplierId },
        select: {
          id: true,
          status: true,
          person: { select: { fullName: true, email: true } },
          company: { select: { tradeName: true, corporateName: true, emailPrimary: true } },
        },
      }),
    ]);
    if (!research) throw new PriceResearchError("Pesquisa de preços não encontrada.");
    assertPriceResearchResponseOpen(research, now);
    if (!supplier || !isSupplierActiveForPriceResearch(supplier.status)) {
      throw new PriceResearchError("O fornecedor não está ativo para responder pesquisas de preços.");
    }
    if (!supplierContactEmail(supplier)) throw new PriceResearchError("O fornecedor precisa possuir e-mail cadastrado para vincular o acesso autenticado ao convite.");

    const existing = await tx.priceQuote.findFirst({
      where: {
        researchId: research.id,
        supplierId: supplier.id,
        status: { in: [priceQuoteStatuses.invitationPending, priceQuoteStatuses.draft, priceQuoteStatuses.submitted, priceQuoteStatuses.legacyActive] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      if (isSubmittedPriceQuote(existing.status)) throw new PriceResearchError("Este fornecedor já apresentou uma cotação para a pesquisa.");
      return { invitation: existing, created: false, supplierName: supplierName(supplier) };
    }

    const invitation = await tx.priceQuote.create({
      data: {
        researchId: research.id,
        supplierId: supplier.id,
        value: 0,
        status: priceQuoteStatuses.invitationPending,
      },
    });
    await writePriceResearchLifecycleEvent(tx, {
      eventType: "PRICE_RESEARCH_INVITATION_PENDING_DELIVERY",
      quoteId: invitation.id,
      researchId: research.id,
      actorUsuarioId: input.actorUsuarioId,
      idempotencyKey: `PRICE_RESEARCH:PRICE_QUOTE:${invitation.id}:INVITATION_PENDING_DELIVERY`,
    });
    return { invitation, created: true, supplierName: supplierName(supplier) };
  });
}

async function loadInvitationForMutation(tx: Tx, input: { invitationId: string; researchId: string; supplierId: string }) {
  const invitation = await tx.priceQuote.findFirst({
    where: { id: input.invitationId, researchId: input.researchId, supplierId: input.supplierId },
    include: {
      research: { select: { id: true, status: true, date: true, createdAt: true } },
      supplier: { select: { id: true, status: true } },
    },
  });
  if (!invitation) throw new PriceResearchError("Convite de cotação não encontrado.");
  return invitation;
}

export async function saveSupplierPriceQuoteDraft(
  db: Db,
  input: { invitationId: string; researchId: string; supplierId: string; value: number; now?: Date },
) {
  const now = input.now ?? new Date();
  const value = normalizeMoney(input.value);

  return db.$transaction(async (tx) => {
    const invitation = await loadInvitationForMutation(tx, input);
    if (isSubmittedPriceQuote(invitation.status)) throw new PriceResearchError("A cotação já foi apresentada e não pode ser alterada.");
    if (invitation.status === priceQuoteStatuses.cancelled) throw new PriceResearchError("O convite de cotação foi cancelado.");
    assertPriceResearchResponseOpen(invitation.research, now);
    if (!isSupplierActiveForPriceResearch(invitation.supplier.status)) {
      throw new PriceResearchError("Fornecedor inativo ou bloqueado não pode responder pesquisas de preços.");
    }

    const updated = await tx.priceQuote.updateMany({
      where: { id: invitation.id, status: { in: mutableQuoteStatuses } },
      data: { value, status: priceQuoteStatuses.draft },
    });
    if (!updated.count) {
      const current = await tx.priceQuote.findUnique({ where: { id: invitation.id } });
      if (current && isSubmittedPriceQuote(current.status)) throw new PriceResearchError("A cotação já foi apresentada e não pode ser alterada.");
      throw new PriceResearchError("O estado do convite mudou; atualize a página antes de salvar o rascunho.");
    }

    const quote = await tx.priceQuote.findUnique({ where: { id: invitation.id } });
    if (!quote) throw new PriceResearchError("Convite de cotação não encontrado.");
    return quote;
  });
}

export async function submitSupplierPriceQuote(
  db: Db,
  input: { invitationId: string; researchId: string; supplierId: string; actorUsuarioId: string; value: number; now?: Date },
) {
  const now = input.now ?? new Date();
  const value = normalizeMoney(input.value);

  return db.$transaction(async (tx) => {
    const invitation = await loadInvitationForMutation(tx, input);
    if (isSubmittedPriceQuote(invitation.status)) {
      if (toCents(invitation.value) !== toCents(value)) {
        throw new PriceResearchError("A cotação já foi apresentada e não pode ser alterada.");
      }
      return { quote: invitation, alreadySubmitted: true };
    }
    if (invitation.status === priceQuoteStatuses.cancelled) throw new PriceResearchError("O convite de cotação foi cancelado.");
    assertPriceResearchResponseOpen(invitation.research, now);
    if (!isSupplierActiveForPriceResearch(invitation.supplier.status)) {
      throw new PriceResearchError("Fornecedor inativo ou bloqueado não pode responder pesquisas de preços.");
    }

    const updated = await tx.priceQuote.updateMany({
      where: { id: invitation.id, status: { in: mutableQuoteStatuses } },
      data: { value, status: priceQuoteStatuses.submitted, date: now },
    });
    if (!updated.count) {
      const current = await tx.priceQuote.findUnique({ where: { id: invitation.id } });
      if (current && isSubmittedPriceQuote(current.status) && toCents(current.value) === toCents(value)) {
        return { quote: current, alreadySubmitted: true };
      }
      throw new PriceResearchError("A cotação já foi apresentada e não pode ser alterada.");
    }

    const quote = await tx.priceQuote.findUnique({ where: { id: invitation.id } });
    if (!quote) throw new PriceResearchError("Convite de cotação não encontrado.");
    const submittedQuotes = await tx.priceQuote.findMany({
      where: { researchId: invitation.research.id, status: { in: [priceQuoteStatuses.submitted, priceQuoteStatuses.legacyActive] } },
      select: { id: true, supplierId: true, value: true },
    });
    const comparison = calculatePriceComparison(submittedQuotes);
    await tx.priceResearch.update({ where: { id: invitation.research.id }, data: { estimatedValue: comparison.referenceValue } });
    await writePriceResearchLifecycleEvent(tx, {
      eventType: "PRICE_QUOTE_PRESENTED",
      quoteId: quote.id,
      researchId: invitation.research.id,
      actorUsuarioId: input.actorUsuarioId,
      idempotencyKey: `PRICE_RESEARCH:PRICE_QUOTE:${quote.id}:PRESENTED`,
    });

    return { quote, alreadySubmitted: false };
  });
}

export type SupplierPriceResearchPortalAccess = {
  invitationId: string;
  researchId: string;
  supplierId: string;
  supplierName: string;
  researchStatus: string;
  quoteStatus: string;
  quoteValue: number;
  presentedAt: Date | null;
  canRespond: boolean;
  unavailableReason: "SUPPLIER_INACTIVE" | "RESEARCH_CLOSED" | "QUOTE_SUBMITTED" | null;
  process: {
    number: string;
    object: string;
    purchaseRequestNumber: string | null;
    items: Array<{ id: string; name: string; unit: string; quantity: number }>;
  };
};

export async function getSupplierPriceResearchPortalAccess(
  db: Db,
  input: { accessKey: string; authenticatedEmail: string; now?: Date },
): Promise<SupplierPriceResearchPortalAccess> {
  const claims = verifySupplierInvitationAccessKey(input.accessKey);
  const invitation = await db.priceQuote.findUnique({
    where: { id: claims.i },
    include: {
      supplier: {
        select: {
          id: true,
          status: true,
          person: { select: { fullName: true, email: true } },
          company: { select: { tradeName: true, corporateName: true, emailPrimary: true } },
        },
      },
      research: {
        include: {
          process: {
            include: {
              purchaseRequest: { select: { number: true } },
              items: {
                orderBy: { createdAt: "asc" },
                include: {
                  catalogItem: { select: { name: true, unit: true } },
                  material: { select: { name: true, unitOfMeasure: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!invitation || invitation.researchId !== claims.r || invitation.supplierId !== claims.s || invitation.status === priceQuoteStatuses.cancelled) {
    throw new PriceResearchError("Acesso à cotação não autorizado.");
  }

  assertSupplierIdentity(invitation.supplier, input.authenticatedEmail);
  const now = input.now ?? new Date();
  const submitted = isSubmittedPriceQuote(invitation.status);
  const supplierActive = isSupplierActiveForPriceResearch(invitation.supplier.status);
  const researchOpen = isPriceResearchResponseOpen(invitation.research, now);
  const unavailableReason = submitted
    ? "QUOTE_SUBMITTED"
    : !supplierActive
      ? "SUPPLIER_INACTIVE"
      : !researchOpen
        ? "RESEARCH_CLOSED"
        : null;

  return {
    invitationId: invitation.id,
    researchId: invitation.researchId,
    supplierId: invitation.supplierId,
    supplierName: supplierName(invitation.supplier),
    researchStatus: invitation.research.status,
    quoteStatus: invitation.status,
    quoteValue: invitation.value,
    presentedAt: submitted ? invitation.date : null,
    canRespond: unavailableReason === null,
    unavailableReason,
    process: {
      number: invitation.research.process.number,
      object: invitation.research.process.object,
      purchaseRequestNumber: invitation.research.process.purchaseRequest?.number ?? null,
      items: invitation.research.process.items.map((item) => ({
        id: item.id,
        name: item.catalogItem?.name || item.material?.name || item.customName || "Item sem descrição",
        unit: item.catalogItem?.unit || item.material?.unitOfMeasure || "UN",
        quantity: item.quantity,
      })),
    },
  };
}

export async function getSupplierPriceQuoteReportAccess(
  db: Db,
  input: { accessKey: string; authenticatedEmail: string; now?: Date },
) {
  const access = await getSupplierPriceResearchPortalAccess(db, input);
  if (!isSubmittedPriceQuote(access.quoteStatus) || !access.presentedAt) {
    throw new PriceResearchError("A proposta ainda não foi apresentada.");
  }
  return access;
}
