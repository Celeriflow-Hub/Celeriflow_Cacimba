import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePriceComparison,
  createSupplierInvitationAccessKey,
  getSupplierPriceResearchPortalAccess,
  inviteSupplierToPriceResearch,
  isPriceResearchResponseOpen,
  isSupplierActiveForPriceResearch,
  PriceResearchError,
  priceQuoteStatuses,
  priceResearchStatuses,
  submitSupplierPriceQuote,
  verifySupplierInvitationAccessKey,
} from "../src/lib/compras/price-research";

process.env.PRICE_RESEARCH_PORTAL_SECRET = "price-research-test-secret";

type LifecycleEvent = {
  eventType: string;
  entityType: string;
  entityId: string;
  sourceType: string;
  sourceId: string;
  actorUsuarioId: string;
  idempotencyKey: string;
};

function submissionDatabase(input: { deadlineAt: Date; supplierStatus?: string; quoteStatus?: string; quoteValue?: number; concurrentSubmittedValue?: number }) {
  let quoteUpdates = 0;
  let referenceValue: number | null = null;
  const lifecycleEvents: LifecycleEvent[] = [];
  const invitation = {
    id: "quote-1",
    researchId: "research-1",
    supplierId: "supplier-1",
    value: input.quoteValue ?? 0,
    status: input.quoteStatus ?? priceQuoteStatuses.invitationPending,
    date: new Date("2026-09-19T09:00:00.000Z"),
    research: {
      id: "research-1",
      status: priceResearchStatuses.inProgress,
      createdAt: new Date("2026-09-19T09:00:00.000Z"),
      date: input.deadlineAt,
    },
    supplier: { id: "supplier-1", status: input.supplierStatus ?? "Ativo" },
  };
  const tx = {
    priceQuote: {
      findFirst: async () => invitation,
      findUnique: async () => invitation,
      update: async ({ data }: { data: Partial<typeof invitation> }) => {
        quoteUpdates += 1;
        Object.assign(invitation, data);
        return { id: invitation.id, value: invitation.value, status: invitation.status, date: invitation.date };
      },
      updateMany: async ({ data }: { data: Partial<typeof invitation> }) => {
        if (input.concurrentSubmittedValue !== undefined) {
          Object.assign(invitation, { value: input.concurrentSubmittedValue, status: priceQuoteStatuses.submitted, date: new Date("2026-09-19T10:30:00.000Z") });
          return { count: 0 };
        }
        quoteUpdates += 1;
        Object.assign(invitation, data);
        return { count: 1 };
      },
      findMany: async () => [{ id: invitation.id, supplierId: invitation.supplierId, value: invitation.value }],
    },
    priceResearch: {
      update: async ({ data }: { data: { estimatedValue: number | null } }) => {
        referenceValue = data.estimatedValue;
        return { id: "research-1" };
      },
    },
    procurementLifecycleEvent: {
      create: async ({ data }: { data: LifecycleEvent }) => {
        lifecycleEvents.push(data);
        return { id: `event-${lifecycleEvents.length}` };
      },
    },
  };
  return {
    db: { $transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx) },
    invitation,
    quoteUpdates: () => quoteUpdates,
    referenceValue: () => referenceValue,
    lifecycleEvents: () => lifecycleEvents,
  };
}

test("CLC-012 calculates a reference and marks every tied minimum without turning omissions into zero", () => {
  const comparison = calculatePriceComparison([
    { id: "quote-a", supplierId: "supplier-a", value: 3700 },
    { id: "quote-b", supplierId: "supplier-b", value: 3500 },
    { id: "quote-c", supplierId: "supplier-c", value: 3500 },
    { id: "draft", supplierId: "supplier-d", value: 0 },
  ]);

  assert.equal(comparison.minimumValue, 3500);
  assert.ok(Math.abs((comparison.referenceValue ?? 0) - (3700 + 3500 + 3500) / 3) < 0.000001);
  assert.deepEqual(comparison.quoteIdsAtMinimum, ["quote-b", "quote-c"]);
});

test("CLC-017 uses an inclusive start and exclusive deadline", () => {
  const research = {
    status: priceResearchStatuses.inProgress,
    createdAt: new Date("2026-09-19T10:00:00.000Z"),
    date: new Date("2026-09-19T12:00:00.000Z"),
  };

  assert.equal(isPriceResearchResponseOpen(research, new Date("2026-09-19T10:00:00.000Z")), true);
  assert.equal(isPriceResearchResponseOpen(research, new Date("2026-09-19T11:59:59.999Z")), true);
  assert.equal(isPriceResearchResponseOpen(research, new Date("2026-09-19T12:00:00.000Z")), false);
});

test("CLC-013 signs each supplier invitation and rejects a modified scope", () => {
  const accessKey = createSupplierInvitationAccessKey({ id: "quote-1", researchId: "research-1", supplierId: "supplier-1" });
  assert.deepEqual(verifySupplierInvitationAccessKey(accessKey), { v: 1, i: "quote-1", r: "research-1", s: "supplier-1" });
  assert.throws(() => verifySupplierInvitationAccessKey(`${accessKey}x`), PriceResearchError);
});

test("CLC-013 records a pending manual-delivery invitation with its responsible user", async () => {
  const lifecycleEvents: LifecycleEvent[] = [];
  const invitation = { id: "quote-1", researchId: "research-1", supplierId: "supplier-1", value: 0, status: priceQuoteStatuses.invitationPending };
  const tx = {
    priceResearch: {
      findUnique: async () => ({ id: "research-1", status: priceResearchStatuses.inProgress, createdAt: new Date("2026-09-19T09:00:00.000Z"), date: new Date("2026-09-19T12:00:00.000Z") }),
    },
    supplier: {
      findUnique: async () => ({ id: "supplier-1", status: "Ativo", person: { fullName: "Fornecedor A", email: "fornecedor@example.test" }, company: null }),
    },
    priceQuote: {
      findFirst: async () => null,
      create: async () => invitation,
    },
    procurementLifecycleEvent: {
      create: async ({ data }: { data: LifecycleEvent }) => {
        lifecycleEvents.push(data);
        return { id: "event-1" };
      },
    },
  };

  const result = await inviteSupplierToPriceResearch({ $transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx) } as never, {
    researchId: "research-1",
    supplierId: "supplier-1",
    actorUsuarioId: "buyer-user-1",
    now: new Date("2026-09-19T10:00:00.000Z"),
  });

  assert.equal(result.created, true);
  assert.deepEqual(lifecycleEvents, [{
    eventType: "PRICE_RESEARCH_INVITATION_PENDING_DELIVERY",
    entityType: "PRICE_QUOTE",
    entityId: "quote-1",
    sourceType: "PRICE_RESEARCH",
    sourceId: "research-1",
    actorUsuarioId: "buyer-user-1",
    idempotencyKey: "PRICE_RESEARCH:PRICE_QUOTE:quote-1:INVITATION_PENDING_DELIVERY",
  }]);
});

test("CLC-014 isolates the supplier portal to the authenticated invitation contact", async () => {
  const accessKey = createSupplierInvitationAccessKey({ id: "quote-1", researchId: "research-1", supplierId: "supplier-1" });
  const database = {
    priceQuote: {
      findUnique: async () => ({
        id: "quote-1",
        researchId: "research-1",
        supplierId: "supplier-1",
        status: priceQuoteStatuses.invitationPending,
        value: 0,
        date: new Date("2026-09-19T09:00:00.000Z"),
        supplier: { id: "supplier-1", status: "Ativo", person: { fullName: "Fornecedor A", email: "fornecedor@example.test" }, company: null },
        research: {
          status: priceResearchStatuses.inProgress,
          createdAt: new Date("2026-09-19T09:00:00.000Z"),
          date: new Date("2026-09-19T12:00:00.000Z"),
          process: { number: "PROC-1", object: "Compra de teste", purchaseRequest: { number: "REQ-1" }, items: [] },
        },
      }),
    },
  };

  await assert.rejects(
    getSupplierPriceResearchPortalAccess(database as never, {
      accessKey,
      authenticatedEmail: "outro-fornecedor@example.test",
      now: new Date("2026-09-19T10:00:00.000Z"),
    }),
    /não autorizado/,
  );
});

test("CLC-017 rejects a direct quote submission at the deadline before persistence", async () => {
  const database = submissionDatabase({ deadlineAt: new Date("2026-09-19T12:00:00.000Z") });

  await assert.rejects(
    submitSupplierPriceQuote(database.db as never, {
      invitationId: "quote-1",
      researchId: "research-1",
      supplierId: "supplier-1",
      actorUsuarioId: "supplier-user-1",
      value: 3700,
      now: new Date("2026-09-19T12:00:00.000Z"),
    }),
    PriceResearchError,
  );
  assert.equal(database.quoteUpdates(), 0);
});

test("CLC-018 persists the server presentation timestamp and refreshes the reference", async () => {
  const database = submissionDatabase({ deadlineAt: new Date("2026-09-19T12:00:00.000Z") });
  const presentedAt = new Date("2026-09-19T11:00:00.000Z");

  const result = await submitSupplierPriceQuote(database.db as never, {
    invitationId: "quote-1",
    researchId: "research-1",
    supplierId: "supplier-1",
    actorUsuarioId: "supplier-user-1",
    value: 3700,
    now: presentedAt,
  });

  assert.equal(result.alreadySubmitted, false);
  assert.equal(result.quote.date.getTime(), presentedAt.getTime());
  assert.equal(database.invitation.status, priceQuoteStatuses.submitted);
  assert.equal(database.referenceValue(), 3700);
  assert.deepEqual(database.lifecycleEvents(), [{
    eventType: "PRICE_QUOTE_PRESENTED",
    entityType: "PRICE_QUOTE",
    entityId: "quote-1",
    sourceType: "PRICE_RESEARCH",
    sourceId: "research-1",
    actorUsuarioId: "supplier-user-1",
    idempotencyKey: "PRICE_RESEARCH:PRICE_QUOTE:quote-1:PRESENTED",
  }]);
});

test("CLC-018 preserves the first concurrent presentation instead of overwriting it", async () => {
  const database = submissionDatabase({ deadlineAt: new Date("2026-09-19T12:00:00.000Z"), concurrentSubmittedValue: 3650 });

  await assert.rejects(
    submitSupplierPriceQuote(database.db as never, {
      invitationId: "quote-1",
      researchId: "research-1",
      supplierId: "supplier-1",
      actorUsuarioId: "supplier-user-1",
      value: 3700,
      now: new Date("2026-09-19T11:00:00.000Z"),
    }),
    /já foi apresentada/,
  );
  assert.equal(database.invitation.value, 3650);
  assert.equal(database.invitation.status, priceQuoteStatuses.submitted);
});

test("CLC-019 accepts only active suppliers and blocks an inactive supplier before quote persistence", async () => {
  assert.equal(isSupplierActiveForPriceResearch("Ativo"), true);
  assert.equal(isSupplierActiveForPriceResearch("Suspenso"), false);
  assert.equal(isSupplierActiveForPriceResearch("Inativo"), false);
  assert.equal(isSupplierActiveForPriceResearch("Bloqueado"), false);

  const database = submissionDatabase({ deadlineAt: new Date("2026-09-19T12:00:00.000Z"), supplierStatus: "Suspenso" });
  await assert.rejects(
    submitSupplierPriceQuote(database.db as never, {
      invitationId: "quote-1",
      researchId: "research-1",
      supplierId: "supplier-1",
      actorUsuarioId: "supplier-user-1",
      value: 3700,
      now: new Date("2026-09-19T11:00:00.000Z"),
    }),
    /inativo ou bloqueado/,
  );
  assert.equal(database.quoteUpdates(), 0);
});
