import { Prisma, type PrismaClient } from "@prisma/client";
import {
  cancelCommitment,
  cancelSettlement,
  createBudgetReservation,
  createCommitment,
  createExpenseRequest,
  createSettlement,
  type FinanceActor,
} from "@/lib/financeiro";

type Db = PrismaClient;
type InstrumentSource = { sourceType: "CONTRACT" | "COVENANT"; sourceId: string };

export class ProcurementFinanceBridgeError extends Error {}

export const procurementFinanceEventTypes = {
  expenseAuthorizationCreated: "PROCUREMENT_EXPENSE_AUTHORIZATION_CREATED",
  supplyAuthorizationCreated: "PROCUREMENT_SUPPLY_AUTHORIZATION_CREATED",
  supplyAuthorizationCancelled: "PROCUREMENT_SUPPLY_AUTHORIZATION_CANCELLED",
  liquidationAuthorizationCreated: "PROCUREMENT_LIQUIDATION_AUTHORIZATION_CREATED",
  liquidationAuthorizationCancelled: "PROCUREMENT_LIQUIDATION_AUTHORIZATION_CANCELLED",
  commitmentCreated: "PROCUREMENT_COMMITMENT_CREATED",
  commitmentCancelled: "PROCUREMENT_COMMITMENT_CANCELLED",
  settlementCreated: "PROCUREMENT_SETTLEMENT_CREATED",
  settlementCancelled: "PROCUREMENT_SETTLEMENT_CANCELLED",
} as const;

export type ExpenseAuthorizationAllocation = {
  sourceItemId: string;
  originId: string;
  sourceQuantity: number;
  originQuantity: number;
  budgetAppropriationId: string;
  valueDecimal: Prisma.Decimal | string | number;
};

export type ExpenseAuthorizationPlanItem = {
  appropriationId: string;
  valueDecimal: Prisma.Decimal;
};

function requiredText(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) throw new ProcurementFinanceBridgeError(`${label} é obrigatório.`);
  return normalized;
}

function validDate(value: Date, label: string) {
  if (Number.isNaN(value.valueOf())) throw new ProcurementFinanceBridgeError(`${label} inválida.`);
  return value;
}

function decimal(value: Prisma.Decimal | string | number, label: string, options: { positive?: boolean } = {}) {
  let parsed: Prisma.Decimal;
  try {
    parsed = new Prisma.Decimal(value);
  } catch {
    throw new ProcurementFinanceBridgeError(`${label} inválido.`);
  }
  if (!parsed.isFinite() || parsed.isNegative() || (options.positive && parsed.isZero())) {
    throw new ProcurementFinanceBridgeError(`${label} inválido.`);
  }
  return parsed.toDecimalPlaces(2);
}

function sameMoney(left: Prisma.Decimal | null, right: Prisma.Decimal) {
  return left !== null && new Prisma.Decimal(left).toDecimalPlaces(2).equals(right.toDecimalPlaces(2));
}

function positiveQuantity(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new ProcurementFinanceBridgeError(`${label} deve ser maior que zero.`);
  return value;
}

function sourceForMeasurement(measurement: { contractId: string | null; covenantId: string | null }): InstrumentSource {
  if (measurement.contractId && !measurement.covenantId) return { sourceType: "CONTRACT", sourceId: measurement.contractId };
  if (measurement.covenantId && !measurement.contractId) return { sourceType: "COVENANT", sourceId: measurement.covenantId };
  throw new ProcurementFinanceBridgeError("A medição não possui um instrumento de origem válido.");
}

function eventInput(
  eventType: string,
  entityType: string,
  entityId: string,
  source: InstrumentSource,
  actor: FinanceActor,
  idempotencyKey: string,
) {
  return {
    eventType,
    entityType,
    entityId,
    sourceType: source.sourceType,
    sourceId: source.sourceId,
    actorUsuarioId: requiredText(actor.usuarioId, "Usuário responsável"),
    idempotencyKey,
  };
}

function assertSameLifecycleEvent<T extends { eventType: string; entityType: string; entityId: string; sourceType: string | null; sourceId: string | null }>(
  event: T,
  expected: ReturnType<typeof eventInput>,
): T {
  if (
    event.eventType !== expected.eventType
    || event.entityType !== expected.entityType
    || event.entityId !== expected.entityId
    || event.sourceType !== expected.sourceType
    || event.sourceId !== expected.sourceId
  ) {
    throw new ProcurementFinanceBridgeError("A chave de idempotência já está vinculada a outro ato de Compras.");
  }
  return event;
}

async function ensureLifecycleEvent(db: Db, input: ReturnType<typeof eventInput>) {
  const select = {
    eventType: true,
    entityType: true,
    entityId: true,
    sourceType: true,
    sourceId: true,
    id: true,
  } as const;
  const existing = await db.procurementLifecycleEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select });
  if (existing) return assertSameLifecycleEvent(existing, input);

  try {
    return await db.procurementLifecycleEvent.create({ data: input, select });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const concurrent = await db.procurementLifecycleEvent.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select });
    if (!concurrent) throw error;
    return assertSameLifecycleEvent(concurrent, input);
  }
}

function eventKey(step: string, sourceType: string, sourceId: string, detail?: string) {
  return buildProcurementFinanceIdempotencyKey(step, sourceType, sourceId, detail);
}

export function buildProcurementFinanceIdempotencyKey(step: string, sourceType: string, sourceId: string, detail?: string) {
  const parts = [
    "C5",
    "PROCUREMENT_FINANCE",
    requiredText(step, "Etapa financeira"),
    requiredText(sourceType, "Tipo da origem"),
    requiredText(sourceId, "Origem"),
  ];
  if (detail !== undefined) parts.push(requiredText(detail, "Detalhe da origem"));
  return parts.join(":");
}

export function isContractSupplyAuthorizationEligible(status: string, startDate: Date, endDate: Date, authorizedAt: Date) {
  return status === "Vigente"
    && !Number.isNaN(startDate.valueOf())
    && !Number.isNaN(endDate.valueOf())
    && !Number.isNaN(authorizedAt.valueOf())
    && startDate <= authorizedAt
    && authorizedAt <= endDate;
}

export function isPurchaseReceiptLiquidationAuthorizationEligible(status: string) {
  return status === "APPROVED";
}

export function isInstrumentMeasurementLiquidationAuthorizationEligible(status: string) {
  return status === "Atestada";
}

export function buildExpenseAuthorizationPlan(
  allocations: readonly ExpenseAuthorizationAllocation[],
  contractValue: Prisma.Decimal | string | number,
): ExpenseAuthorizationPlanItem[] {
  const expectedValue = decimal(contractValue, "Valor do contrato", { positive: true });
  if (!allocations.length) throw new ProcurementFinanceBridgeError("O contrato não possui alocações orçamentárias de origem.");

  const sourceQuantities = new Map<string, number>();
  const originTotals = new Map<string, number>();
  const origins = new Map<string, { sourceItemId: string; originQuantity: number }>();
  const appropriationsBySource = new Map<string, Set<string>>();
  const byAppropriation = new Map<string, Prisma.Decimal>();

  for (const allocation of allocations) {
    const sourceItemId = requiredText(allocation.sourceItemId, "Item de origem");
    const originId = requiredText(allocation.originId, "Vínculo do item de origem");
    const appropriationId = requiredText(allocation.budgetAppropriationId, "Dotação orçamentária");
    const sourceQuantity = positiveQuantity(allocation.sourceQuantity, "Quantidade do item de origem");
    const originQuantity = positiveQuantity(allocation.originQuantity, "Quantidade vinculada ao processo");
    if (originQuantity > sourceQuantity) {
      throw new ProcurementFinanceBridgeError("A quantidade vinculada ao processo excede a quantidade do item de origem.");
    }

    const knownSourceQuantity = sourceQuantities.get(sourceItemId);
    if (knownSourceQuantity !== undefined && knownSourceQuantity !== sourceQuantity) {
      throw new ProcurementFinanceBridgeError("O item de origem possui quantidades conflitantes.");
    }
    sourceQuantities.set(sourceItemId, sourceQuantity);
    const appropriations = appropriationsBySource.get(sourceItemId) ?? new Set<string>();
    appropriations.add(appropriationId);
    appropriationsBySource.set(sourceItemId, appropriations);
    const knownOrigin = origins.get(originId);
    if (knownOrigin) {
      if (knownOrigin.sourceItemId !== sourceItemId || knownOrigin.originQuantity !== originQuantity) {
        throw new ProcurementFinanceBridgeError("O vínculo do item de origem possui dados conflitantes.");
      }
    } else {
      origins.set(originId, { sourceItemId, originQuantity });
      originTotals.set(sourceItemId, (originTotals.get(sourceItemId) ?? 0) + originQuantity);
    }

    const allocatedValue = decimal(allocation.valueDecimal, "Valor da alocação");
    const apportionedValue = allocatedValue.mul(originQuantity).div(sourceQuantity);
    byAppropriation.set(appropriationId, (byAppropriation.get(appropriationId) ?? new Prisma.Decimal(0)).plus(apportionedValue));
  }

  for (const [sourceItemId, originTotal] of originTotals) {
    if (originTotal > sourceQuantities.get(sourceItemId)! + 0.0000001) {
      throw new ProcurementFinanceBridgeError("O item de origem foi vinculado ao processo acima de sua quantidade disponível.");
    }
    if (originTotal < sourceQuantities.get(sourceItemId)! - 0.0000001 && appropriationsBySource.get(sourceItemId)!.size > 1) {
      throw new ProcurementFinanceBridgeError("Não é seguro ratear parcialmente um item de origem entre várias dotações.");
    }
  }

  const plan = [...byAppropriation]
    .map(([appropriationId, valueDecimal]) => ({ appropriationId, valueDecimal: valueDecimal.toDecimalPlaces(2) }))
    .filter((item) => item.valueDecimal.greaterThan(0))
    .sort((left, right) => left.appropriationId.localeCompare(right.appropriationId));
  const plannedValue = plan.reduce((total, item) => total.plus(item.valueDecimal), new Prisma.Decimal(0));
  if (!plannedValue.equals(expectedValue)) {
    throw new ProcurementFinanceBridgeError("As dotações herdadas não conciliam exatamente com o valor atualizado do contrato.");
  }
  return plan;
}

async function contractForExpenseAuthorizations(db: Db, contractId: string, authorizedAt: Date) {
  const contract = await db.contract.findUnique({
    where: { id: contractId },
    select: {
      id: true,
      number: true,
      object: true,
      status: true,
      startDate: true,
      endDate: true,
      updatedValue: true,
      sourceBudgetUnitId: true,
      supplierId: true,
      secretariatId: true,
      supplier: { select: { status: true } },
      process: {
        select: {
          id: true,
          purchaseRequest: {
            select: {
              items: {
                select: {
                  id: true,
                  quantity: true,
                  budgetAllocations: { select: { budgetAppropriationId: true, valueDecimal: true } },
                },
              },
            },
          },
          items: {
            select: {
              id: true,
              requestItemOrigins: {
                select: {
                  id: true,
                  quantity: true,
                  purchaseRequestItem: {
                    select: {
                      id: true,
                      quantity: true,
                      budgetAllocations: { select: { budgetAppropriationId: true, valueDecimal: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!contract) throw new ProcurementFinanceBridgeError("Contrato não encontrado.");
  if (!contract.sourceBudgetUnitId) throw new ProcurementFinanceBridgeError("O contrato não possui Unidade Gestora de origem para gerar AE.");
  if (contract.supplier.status !== "Ativo") throw new ProcurementFinanceBridgeError("O fornecedor do contrato não está ativo.");
  if (!isContractSupplyAuthorizationEligible(contract.status, contract.startDate, contract.endDate, authorizedAt)) {
    throw new ProcurementFinanceBridgeError("A geração de AE exige contrato vigente na data autorizada.");
  }
  if (!contract.process.items.length) throw new ProcurementFinanceBridgeError("O contrato não possui itens de processo para herdar as dotações.");

  const hasOrigins = contract.process.items.some((item) => item.requestItemOrigins.length > 0);
  if (hasOrigins && contract.process.items.some((item) => !item.requestItemOrigins.length)) {
    throw new ProcurementFinanceBridgeError("Todos os itens do processo devem possuir origem de solicitação para gerar AE.");
  }

  const allocations: ExpenseAuthorizationAllocation[] = hasOrigins
    ? contract.process.items.flatMap((item) => item.requestItemOrigins.flatMap((origin) => origin.purchaseRequestItem.budgetAllocations.map((allocation) => ({
      sourceItemId: origin.purchaseRequestItem.id,
      originId: origin.id,
      sourceQuantity: origin.purchaseRequestItem.quantity,
      originQuantity: origin.quantity,
      budgetAppropriationId: allocation.budgetAppropriationId,
      valueDecimal: allocation.valueDecimal,
    }))))
    : (contract.process.purchaseRequest?.items ?? []).flatMap((item) => item.budgetAllocations.map((allocation) => ({
      sourceItemId: item.id,
      originId: `LEGACY:${item.id}`,
      sourceQuantity: item.quantity,
      originQuantity: item.quantity,
      budgetAppropriationId: allocation.budgetAppropriationId,
      valueDecimal: allocation.valueDecimal,
    })));
  const plan = buildExpenseAuthorizationPlan(allocations, contract.updatedValue);
  const appropriations = await db.budgetAppropriation.findMany({
    where: { id: { in: plan.map((item) => item.appropriationId) } },
    select: { id: true, budgetUnitId: true },
  });
  if (appropriations.length !== plan.length || appropriations.some((appropriation) => appropriation.budgetUnitId !== contract.sourceBudgetUnitId)) {
    throw new ProcurementFinanceBridgeError("As dotações herdadas devem pertencer à Unidade Gestora de origem do contrato.");
  }
  return { contract, plan };
}

function assertDerivedExpense(
  expense: {
    appropriationId: string;
    supplierId: string | null;
    secretariatId: string;
    sourceModule: string;
    sourceType: string;
    sourceId: string | null;
    eventType: string;
    valueDecimal: Prisma.Decimal | null;
  },
  input: { appropriationId: string; supplierId: string; secretariatId: string; contractId: string; valueDecimal: Prisma.Decimal },
) {
  if (
    expense.appropriationId !== input.appropriationId
    || expense.supplierId !== input.supplierId
    || expense.secretariatId !== input.secretariatId
    || expense.sourceModule !== "COMPRAS"
    || expense.sourceType !== "CONTRACT"
    || expense.sourceId !== input.contractId
    || expense.eventType !== procurementFinanceEventTypes.expenseAuthorizationCreated
    || !sameMoney(expense.valueDecimal, input.valueDecimal)
  ) {
    throw new ProcurementFinanceBridgeError("A AE existente não corresponde à origem contratual informada.");
  }
}

export async function deriveExpenseAuthorizationsForContract(
  db: Db,
  actor: FinanceActor,
  contractId: string,
  authorizedAt = new Date(),
) {
  const normalizedContractId = requiredText(contractId, "Contrato");
  validDate(authorizedAt, "Data da autorização");
  const { contract, plan } = await contractForExpenseAuthorizations(db, normalizedContractId, authorizedAt);
  const authorizations: Array<{ expenseId: string; appropriationId: string; valueDecimal: Prisma.Decimal; eventId: string }> = [];

  for (const item of plan) {
    const key = eventKey("AE", "CONTRACT", contract.id, item.appropriationId);
    let expense = await db.expense.findUnique({ where: { idempotencyKey: key } });
    if (!expense) {
      expense = await createExpenseRequest(db, actor, {
        date: authorizedAt,
        description: `AE ${contract.number}: ${contract.object}`,
        value: item.valueDecimal,
        appropriationId: item.appropriationId,
        supplierId: contract.supplierId,
        secretariatId: contract.secretariatId,
        sourceModule: "COMPRAS",
        sourceType: "CONTRACT",
        sourceId: contract.id,
        eventType: procurementFinanceEventTypes.expenseAuthorizationCreated,
        idempotencyKey: key,
      });
    }
    assertDerivedExpense(expense, {
      appropriationId: item.appropriationId,
      supplierId: contract.supplierId,
      secretariatId: contract.secretariatId,
      contractId: contract.id,
      valueDecimal: item.valueDecimal,
    });
    const event = await ensureLifecycleEvent(db, eventInput(
      procurementFinanceEventTypes.expenseAuthorizationCreated,
      "EXPENSE_AUTHORIZATION",
      expense.id,
      { sourceType: "CONTRACT", sourceId: contract.id },
      actor,
      eventKey("AE_EVENT", "CONTRACT", contract.id, item.appropriationId),
    ));
    authorizations.push({ expenseId: expense.id, appropriationId: item.appropriationId, valueDecimal: item.valueDecimal, eventId: event.id });
  }
  return authorizations;
}

export async function recordSupplyAuthorizationForContract(
  db: Db,
  actor: FinanceActor,
  contractId: string,
  authorizedAt = new Date(),
) {
  const normalizedContractId = requiredText(contractId, "Contrato");
  validDate(authorizedAt, "Data da autorização");
  const contract = await db.contract.findUnique({
    where: { id: normalizedContractId },
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      updatedValue: true,
      supplier: { select: { status: true } },
      process: { select: { items: { select: { quantity: true, estimatedUnitValue: true } } } },
    },
  });
  if (!contract) throw new ProcurementFinanceBridgeError("Contrato não encontrado.");
  if (!isContractSupplyAuthorizationEligible(contract.status, contract.startDate, contract.endDate, authorizedAt)) {
    throw new ProcurementFinanceBridgeError("A geração de AF exige contrato vigente na data autorizada.");
  }
  if (contract.supplier.status !== "Ativo") throw new ProcurementFinanceBridgeError("O fornecedor do contrato não está ativo.");
  if (!contract.process.items.length) throw new ProcurementFinanceBridgeError("A AF exige itens de fornecimento vinculados ao contrato.");

  const itemsValue = contract.process.items.reduce((total, item) => {
    const quantity = positiveQuantity(item.quantity, "Quantidade do item de fornecimento");
    if (item.estimatedUnitValue === null || !Number.isFinite(item.estimatedUnitValue) || item.estimatedUnitValue < 0) {
      throw new ProcurementFinanceBridgeError("Todos os itens da AF devem possuir valor unitário válido.");
    }
    return total.plus(new Prisma.Decimal(String(quantity)).mul(item.estimatedUnitValue));
  }, new Prisma.Decimal(0)).toDecimalPlaces(2);
  if (!itemsValue.equals(decimal(contract.updatedValue, "Valor atualizado do contrato", { positive: true }))) {
    throw new ProcurementFinanceBridgeError("Os itens de fornecimento não conciliam exatamente com o valor atualizado do contrato.");
  }

  return ensureLifecycleEvent(db, eventInput(
    procurementFinanceEventTypes.supplyAuthorizationCreated,
    "SUPPLY_AUTHORIZATION",
    contract.id,
    { sourceType: "CONTRACT", sourceId: contract.id },
    actor,
    eventKey("AF", "CONTRACT", contract.id),
  ));
}

function receiptValue(items: Array<{ quantity: number; unitCost: number }>, options: { positive?: boolean } = {}) {
  if (!items.length) throw new ProcurementFinanceBridgeError("O recebimento não possui itens para gerar AL.");
  const value = items.reduce((total, item) => {
    const quantity = positiveQuantity(item.quantity, "Quantidade recebida");
    if (!Number.isFinite(item.unitCost) || item.unitCost < 0) throw new ProcurementFinanceBridgeError("Custo unitário do recebimento inválido.");
    return total.plus(new Prisma.Decimal(String(quantity)).mul(item.unitCost));
  }, new Prisma.Decimal(0)).toDecimalPlaces(2);
  if (options.positive !== false && value.lessThanOrEqualTo(0)) {
    throw new ProcurementFinanceBridgeError("O recebimento deve possuir valor positivo para gerar AL.");
  }
  return value;
}

export async function recordPurchaseReceiptLiquidationAuthorization(
  db: Db,
  actor: FinanceActor,
  purchaseReceiptId: string,
) {
  const receipt = await db.purchaseReceipt.findUnique({
    where: { id: requiredText(purchaseReceiptId, "Recebimento") },
    select: { id: true, status: true, contractId: true, items: { select: { quantity: true, unitCost: true } } },
  });
  if (!receipt) throw new ProcurementFinanceBridgeError("Recebimento não encontrado.");
  if (!isPurchaseReceiptLiquidationAuthorizationEligible(receipt.status)) {
    throw new ProcurementFinanceBridgeError("A AL exige um recebimento aprovado.");
  }
  const valueDecimal = receiptValue(receipt.items, { positive: false });
  if (valueDecimal.isZero()) return null;
  const event = await ensureLifecycleEvent(db, eventInput(
    procurementFinanceEventTypes.liquidationAuthorizationCreated,
    "LIQUIDATION_AUTHORIZATION",
    receipt.id,
    { sourceType: "CONTRACT", sourceId: receipt.contractId },
    actor,
    eventKey("AL", "PURCHASE_RECEIPT", receipt.id),
  ));
  return { eventId: event.id, valueDecimal };
}

export async function recordInstrumentMeasurementLiquidationAuthorization(
  db: Db,
  actor: FinanceActor,
  measurementId: string,
) {
  const measurement = await db.instrumentMeasurement.findUnique({
    where: { id: requiredText(measurementId, "Medição") },
    select: { id: true, status: true, contractId: true, covenantId: true, valueDecimal: true },
  });
  if (!measurement) throw new ProcurementFinanceBridgeError("Medição não encontrada.");
  if (!isInstrumentMeasurementLiquidationAuthorizationEligible(measurement.status)) return null;
  const valueDecimal = decimal(measurement.valueDecimal, "Valor da medição");
  if (valueDecimal.isZero()) return null;
  const source = sourceForMeasurement(measurement);
  const event = await ensureLifecycleEvent(db, eventInput(
    procurementFinanceEventTypes.liquidationAuthorizationCreated,
    "LIQUIDATION_AUTHORIZATION",
    measurement.id,
    source,
    actor,
    eventKey("AL", "INSTRUMENT_MEASUREMENT", measurement.id),
  ));
  return { eventId: event.id, valueDecimal };
}

async function contractForExpenseAuthorization(db: Db, expenseId: string) {
  const expense = await db.expense.findUnique({
    where: { id: requiredText(expenseId, "AE") },
    select: {
      id: true,
      status: true,
      valueDecimal: true,
      appropriationId: true,
      supplierId: true,
      sourceModule: true,
      sourceType: true,
      sourceId: true,
      eventType: true,
    },
  });
  if (!expense) throw new ProcurementFinanceBridgeError("AE não encontrada.");
  if (
    expense.sourceModule !== "COMPRAS"
    || expense.sourceType !== "CONTRACT"
    || !expense.sourceId
    || expense.eventType !== procurementFinanceEventTypes.expenseAuthorizationCreated
    || !expense.supplierId
  ) {
    throw new ProcurementFinanceBridgeError("A solicitação de despesa não é uma AE contratual derivada pelo bridge.");
  }
  const contract = await db.contract.findUnique({
    where: { id: expense.sourceId },
    select: { id: true, number: true, object: true, supplierId: true, status: true },
  });
  if (!contract) throw new ProcurementFinanceBridgeError("O contrato de origem da AE não foi encontrado.");
  if (contract.supplierId !== expense.supplierId) throw new ProcurementFinanceBridgeError("O fornecedor da AE não corresponde ao contrato de origem.");
  return { expense, contract };
}

async function recordCommitmentEvent(db: Db, actor: FinanceActor, commitmentId: string, contractId: string) {
  return ensureLifecycleEvent(db, eventInput(
    procurementFinanceEventTypes.commitmentCreated,
    "COMMITMENT",
    commitmentId,
    { sourceType: "CONTRACT", sourceId: contractId },
    actor,
    eventKey("COMMITMENT", "CONTRACT", contractId, commitmentId),
  ));
}

export async function createCommitmentFromExpenseAuthorization(
  db: Db,
  actor: FinanceActor,
  input: {
    expenseId: string;
    reservationId?: string;
    reservationNumber: string;
    commitmentNumber: string;
    date: Date;
    value?: Prisma.Decimal | string | number;
    type: string;
    history?: string;
  },
) {
  const date = validDate(input.date, "Data do empenho");
  const reservationNumber = requiredText(input.reservationNumber, "Número da reserva");
  const commitmentNumber = requiredText(input.commitmentNumber, "Número do empenho");
  const { expense, contract } = await contractForExpenseAuthorization(db, input.expenseId);
  const valueDecimal = decimal(expense.valueDecimal ?? "0", "Valor da AE", { positive: true });
  if (input.value !== undefined && !decimal(input.value, "Valor do empenho", { positive: true }).equals(valueDecimal)) {
    throw new ProcurementFinanceBridgeError("O empenho deve corresponder integralmente ao valor da AE.");
  }

  const requestedReservationId = input.reservationId === undefined
    ? undefined
    : requiredText(input.reservationId, "Reserva");
  const existingReservation = requestedReservationId
    ? await db.budgetReservation.findUnique({ where: { id: requiredText(requestedReservationId, "Reserva") }, include: { commitment: true } })
    : await db.budgetReservation.findFirst({
      where: { expenseId: expense.id, status: { in: ["Ativa", "Empenhada"] } },
      include: { commitment: true },
      orderBy: { createdAt: "desc" },
    });
  if (requestedReservationId && !existingReservation) {
    throw new ProcurementFinanceBridgeError("Reserva não encontrada.");
  }
  if (existingReservation && existingReservation.expenseId !== expense.id) {
    throw new ProcurementFinanceBridgeError("A reserva informada não pertence à AE.");
  }
  if (existingReservation?.number !== undefined && existingReservation.number !== reservationNumber) {
    throw new ProcurementFinanceBridgeError("A AE já possui uma reserva com outro número.");
  }
  if (existingReservation?.commitment) {
    if (existingReservation.commitment.number !== commitmentNumber) {
      throw new ProcurementFinanceBridgeError("A AE já possui um empenho com outro número.");
    }
    if (existingReservation.commitment.status === "Anulado") {
      throw new ProcurementFinanceBridgeError("O empenho anterior da AE está anulado; emita uma nova AE antes de gerar outro empenho.");
    }
    const event = await recordCommitmentEvent(db, actor, existingReservation.commitment.id, contract.id);
    return { commitment: existingReservation.commitment, eventId: event.id };
  }
  if (!existingReservation && expense.status !== "Aprovada") {
    throw new ProcurementFinanceBridgeError("A emissão do empenho exige uma AE aprovada pelo fluxo financeiro.");
  }

  const reservation = existingReservation ?? await createBudgetReservation(db, actor, {
    number: reservationNumber,
    date,
    value: valueDecimal,
    appropriationId: expense.appropriationId,
    expenseId: expense.id,
    justification: `Reserva da AE derivada do contrato ${contract.number}.`,
  });
  if (reservation.status !== "Ativa") {
    throw new ProcurementFinanceBridgeError("A reserva da AE não está ativa para emissão do empenho.");
  }

  let commitment: Awaited<ReturnType<typeof createCommitment>>;
  try {
    commitment = await createCommitment(db, actor, {
      number: commitmentNumber,
      date,
      value: valueDecimal,
      type: input.type,
      history: input.history?.trim() || `Empenho da AE do contrato ${contract.number}: ${contract.object}`,
      appropriationId: expense.appropriationId,
      supplierId: expense.supplierId!,
      reservationId: reservation.id,
      contractId: contract.id,
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    const concurrent = await db.budgetReservation.findUnique({ where: { id: reservation.id }, include: { commitment: true } });
    if (!concurrent?.commitment || concurrent.commitment.number !== commitmentNumber || concurrent.commitment.status === "Anulado") throw error;
    commitment = concurrent.commitment;
  }
  const event = await recordCommitmentEvent(db, actor, commitment.id, contract.id);
  return { commitment, eventId: event.id };
}

function assertCommitmentSource(
  commitment: { contractId: string | null; covenantId: string | null },
  source: InstrumentSource,
) {
  const belongs = source.sourceType === "CONTRACT"
    ? commitment.contractId === source.sourceId
    : commitment.covenantId === source.sourceId;
  if (!belongs) throw new ProcurementFinanceBridgeError("O empenho não pertence à origem da AL.");
}

async function recordSettlementEvent(db: Db, actor: FinanceActor, settlementId: string, source: InstrumentSource, sourceEntityId: string) {
  return ensureLifecycleEvent(db, eventInput(
    procurementFinanceEventTypes.settlementCreated,
    "SETTLEMENT",
    settlementId,
    source,
    actor,
    eventKey("SETTLEMENT", source.sourceType, sourceEntityId, settlementId),
  ));
}

export async function createSettlementFromPurchaseReceiptAuthorization(
  db: Db,
  actor: FinanceActor,
  input: {
    purchaseReceiptId: string;
    commitmentId: string;
    date?: Date;
    value?: Prisma.Decimal | string | number;
    authorId?: string;
    documentRef?: string;
    fiscalDocumentNumber?: string;
    fiscalDocumentSeries?: string;
    fiscalDocumentIssueDate?: Date;
    fiscalDocumentAccessKey?: string;
    notes?: string;
    serviceCode?: string;
    retentionRuleIds?: string[];
  },
) {
  const receipt = await db.purchaseReceipt.findUnique({
    where: { id: requiredText(input.purchaseReceiptId, "Recebimento") },
    select: {
      id: true,
      number: true,
      status: true,
      receivedAt: true,
      contractId: true,
      documentId: true,
      attesterId: true,
      items: { select: { quantity: true, unitCost: true } },
    },
  });
  if (!receipt || !isPurchaseReceiptLiquidationAuthorizationEligible(receipt.status)) {
    throw new ProcurementFinanceBridgeError("A liquidação exige um recebimento aprovado.");
  }
  await recordPurchaseReceiptLiquidationAuthorization(db, actor, receipt.id);
  const source: InstrumentSource = { sourceType: "CONTRACT", sourceId: receipt.contractId };
  const commitment = await db.commitment.findUnique({
    where: { id: requiredText(input.commitmentId, "Empenho") },
    select: { id: true, contractId: true, covenantId: true },
  });
  if (!commitment) throw new ProcurementFinanceBridgeError("Empenho não encontrado.");
  assertCommitmentSource(commitment, source);
  const valueDecimal = receiptValue(receipt.items);
  const date = validDate(input.date ?? receipt.receivedAt, "Data da liquidação");
  const documentRef = `AL-${receipt.number}`;
  if (input.value !== undefined && !decimal(input.value, "Valor da liquidação", { positive: true }).equals(valueDecimal)) {
    throw new ProcurementFinanceBridgeError("A liquidação deve corresponder integralmente ao valor do recebimento atestado.");
  }
  if (input.authorId && input.authorId !== receipt.attesterId) {
    throw new ProcurementFinanceBridgeError("O responsável pela liquidação deve corresponder ao atestador do recebimento.");
  }
  if (input.documentRef?.trim() && input.documentRef.trim() !== documentRef) {
    throw new ProcurementFinanceBridgeError("A referência da liquidação deve corresponder à AL do recebimento.");
  }
  const existing = await db.settlement.findFirst({
    where: { commitmentId: commitment.id, documentId: receipt.documentId, documentRef },
    select: { id: true, valueDecimal: true, authorId: true, status: true },
  });
  if (existing) {
    if (!sameMoney(existing.valueDecimal, valueDecimal) || existing.authorId !== receipt.attesterId || existing.status !== "Liquidado") {
      throw new ProcurementFinanceBridgeError("A liquidação existente não corresponde à AL do recebimento.");
    }
    const event = await recordSettlementEvent(db, actor, existing.id, source, receipt.id);
    return { settlement: existing, eventId: event.id };
  }

  const settlement = await createSettlement(db, actor, {
    date,
    value: valueDecimal,
    documentRef,
    documentId: receipt.documentId,
    commitmentId: commitment.id,
    authorId: receipt.attesterId,
    fiscalDocumentNumber: input.fiscalDocumentNumber,
    fiscalDocumentSeries: input.fiscalDocumentSeries,
    fiscalDocumentIssueDate: input.fiscalDocumentIssueDate,
    fiscalDocumentAccessKey: input.fiscalDocumentAccessKey,
    notes: input.notes,
    serviceCode: input.serviceCode,
    retentionRuleIds: input.retentionRuleIds,
  });
  const event = await recordSettlementEvent(db, actor, settlement.id, source, receipt.id);
  return { settlement, eventId: event.id };
}

export async function createSettlementFromInstrumentMeasurementAuthorization(
  db: Db,
  actor: FinanceActor,
  input: {
    measurementId: string;
    commitmentId: string;
    documentId?: string;
    authorId: string;
    date?: Date;
    value?: Prisma.Decimal | string | number;
    documentRef?: string;
    fiscalDocumentNumber?: string;
    fiscalDocumentSeries?: string;
    fiscalDocumentIssueDate?: Date;
    fiscalDocumentAccessKey?: string;
    notes?: string;
    serviceCode?: string;
    retentionRuleIds?: string[];
  },
) {
  const measurement = await db.instrumentMeasurement.findUnique({
    where: { id: requiredText(input.measurementId, "Medição") },
    select: { id: true, number: true, status: true, measuredAt: true, valueDecimal: true, documentId: true, contractId: true, covenantId: true },
  });
  if (!measurement || !isInstrumentMeasurementLiquidationAuthorizationEligible(measurement.status)) {
    throw new ProcurementFinanceBridgeError("A liquidação exige uma medição atestada.");
  }
  const authorization = await recordInstrumentMeasurementLiquidationAuthorization(db, actor, measurement.id);
  if (!authorization) throw new ProcurementFinanceBridgeError("A medição atestada não possui valor positivo para gerar AL.");
  const source = sourceForMeasurement(measurement);
  const commitment = await db.commitment.findUnique({
    where: { id: requiredText(input.commitmentId, "Empenho") },
    select: { id: true, contractId: true, covenantId: true },
  });
  if (!commitment) throw new ProcurementFinanceBridgeError("Empenho não encontrado.");
  assertCommitmentSource(commitment, source);
  const documentId = input.documentId?.trim() || measurement.documentId;
  if (!documentId) throw new ProcurementFinanceBridgeError("A liquidação da medição exige documento GED válido.");
  const authorId = requiredText(input.authorId, "Responsável pelo ateste");
  const date = validDate(input.date ?? measurement.measuredAt, "Data da liquidação");
  const documentRef = `AL-MED-${measurement.id}`;
  if (input.value !== undefined && !decimal(input.value, "Valor da liquidação", { positive: true }).equals(authorization.valueDecimal)) {
    throw new ProcurementFinanceBridgeError("A liquidação deve corresponder integralmente ao valor da medição atestada.");
  }
  if (input.documentRef?.trim() && input.documentRef.trim() !== documentRef) {
    throw new ProcurementFinanceBridgeError("A referência da liquidação deve corresponder à AL da medição.");
  }
  const existing = await db.settlement.findFirst({
    where: { commitmentId: commitment.id, documentId, documentRef },
    select: { id: true, valueDecimal: true, authorId: true, status: true },
  });
  if (existing) {
    if (!sameMoney(existing.valueDecimal, authorization.valueDecimal) || existing.authorId !== authorId || existing.status !== "Liquidado") {
      throw new ProcurementFinanceBridgeError("A liquidação existente não corresponde à AL da medição.");
    }
    const event = await recordSettlementEvent(db, actor, existing.id, source, measurement.id);
    return { settlement: existing, eventId: event.id };
  }

  const settlement = await createSettlement(db, actor, {
    date,
    value: authorization.valueDecimal,
    documentRef,
    documentId,
    commitmentId: commitment.id,
    authorId,
    fiscalDocumentNumber: input.fiscalDocumentNumber,
    fiscalDocumentSeries: input.fiscalDocumentSeries,
    fiscalDocumentIssueDate: input.fiscalDocumentIssueDate,
    fiscalDocumentAccessKey: input.fiscalDocumentAccessKey,
    notes: input.notes,
    serviceCode: input.serviceCode,
    retentionRuleIds: input.retentionRuleIds,
  });
  const event = await recordSettlementEvent(db, actor, settlement.id, source, measurement.id);
  return { settlement, eventId: event.id };
}

export async function cancelSupplyAuthorizationForContract(db: Db, actor: FinanceActor, contractId: string) {
  const contract = await db.contract.findUnique({
    where: { id: requiredText(contractId, "Contrato") },
    select: {
      id: true,
      status: true,
      receipts: { where: { status: "APPROVED" }, select: { id: true } },
      measurements: { where: { status: "Atestada" }, select: { id: true } },
    },
  });
  if (!contract) throw new ProcurementFinanceBridgeError("Contrato não encontrado.");
  if (!["Suspenso", "Rescindido"].includes(contract.status)) {
    throw new ProcurementFinanceBridgeError("A anulação da AF exige contrato suspenso ou rescindido.");
  }
  if (contract.receipts.length || contract.measurements.length) {
    throw new ProcurementFinanceBridgeError("A AF não pode ser anulada após recebimento aprovado ou medição atestada.");
  }
  const authorization = await db.procurementLifecycleEvent.findUnique({
    where: { idempotencyKey: eventKey("AF", "CONTRACT", contract.id) },
    select: { id: true },
  });
  if (!authorization) return null;
  return ensureLifecycleEvent(db, eventInput(
    procurementFinanceEventTypes.supplyAuthorizationCancelled,
    "SUPPLY_AUTHORIZATION",
    contract.id,
    { sourceType: "CONTRACT", sourceId: contract.id },
    actor,
    eventKey("AF_CANCEL", "CONTRACT", contract.id),
  ));
}

export async function cancelPurchaseReceiptLiquidationAuthorization(db: Db, actor: FinanceActor, purchaseReceiptId: string) {
  const receipt = await db.purchaseReceipt.findUnique({
    where: { id: requiredText(purchaseReceiptId, "Recebimento") },
    select: { id: true, status: true, contractId: true },
  });
  if (!receipt) throw new ProcurementFinanceBridgeError("Recebimento não encontrado.");
  if (receipt.status !== "CANCELLED") throw new ProcurementFinanceBridgeError("A anulação da AL exige recebimento cancelado.");
  const authorization = await db.procurementLifecycleEvent.findUnique({
    where: { idempotencyKey: eventKey("AL", "PURCHASE_RECEIPT", receipt.id) },
    select: { id: true },
  });
  if (!authorization) return null;
  return ensureLifecycleEvent(db, eventInput(
    procurementFinanceEventTypes.liquidationAuthorizationCancelled,
    "LIQUIDATION_AUTHORIZATION",
    receipt.id,
    { sourceType: "CONTRACT", sourceId: receipt.contractId },
    actor,
    eventKey("AL_CANCEL", "PURCHASE_RECEIPT", receipt.id),
  ));
}

export async function cancelInstrumentMeasurementLiquidationAuthorization(db: Db, actor: FinanceActor, measurementId: string) {
  const measurement = await db.instrumentMeasurement.findUnique({
    where: { id: requiredText(measurementId, "Medição") },
    select: { id: true, status: true, contractId: true, covenantId: true },
  });
  if (!measurement) throw new ProcurementFinanceBridgeError("Medição não encontrada.");
  if (measurement.status !== "Cancelada") throw new ProcurementFinanceBridgeError("A anulação da AL exige medição cancelada.");
  const authorization = await db.procurementLifecycleEvent.findUnique({
    where: { idempotencyKey: eventKey("AL", "INSTRUMENT_MEASUREMENT", measurement.id) },
    select: { id: true },
  });
  if (!authorization) return null;
  const source = sourceForMeasurement(measurement);
  return ensureLifecycleEvent(db, eventInput(
    procurementFinanceEventTypes.liquidationAuthorizationCancelled,
    "LIQUIDATION_AUTHORIZATION",
    measurement.id,
    source,
    actor,
    eventKey("AL_CANCEL", "INSTRUMENT_MEASUREMENT", measurement.id),
  ));
}

export async function cancelCommitmentForCancelledContract(db: Db, actor: FinanceActor, commitmentId: string) {
  const commitment = await db.commitment.findUnique({
    where: { id: requiredText(commitmentId, "Empenho") },
    select: { id: true, contractId: true, status: true },
  });
  if (!commitment?.contractId) throw new ProcurementFinanceBridgeError("O empenho não possui contrato de origem para anulação pelo bridge.");
  await cancelSupplyAuthorizationForContract(db, actor, commitment.contractId);
  const cancelled = commitment.status === "Anulado"
    ? commitment
    : await cancelCommitment(db, actor, commitment.id);
  const event = await ensureLifecycleEvent(db, eventInput(
    procurementFinanceEventTypes.commitmentCancelled,
    "COMMITMENT",
    cancelled.id,
    { sourceType: "CONTRACT", sourceId: commitment.contractId },
    actor,
    eventKey("COMMITMENT_CANCEL", "CONTRACT", commitment.contractId, cancelled.id),
  ));
  return { commitment: cancelled, eventId: event.id };
}

async function cancelSettlementForSource(
  db: Db,
  actor: FinanceActor,
  settlementId: string,
  source: InstrumentSource,
  sourceEntityId: string,
) {
  const settlement = await db.settlement.findUnique({
    where: { id: requiredText(settlementId, "Liquidação") },
    select: { id: true, status: true, commitment: { select: { contractId: true, covenantId: true } } },
  });
  if (!settlement) throw new ProcurementFinanceBridgeError("Liquidação não encontrada.");
  assertCommitmentSource(settlement.commitment, source);
  const cancelled = settlement.status === "Cancelado"
    ? settlement
    : await cancelSettlement(db, actor, settlement.id);
  const event = await ensureLifecycleEvent(db, eventInput(
    procurementFinanceEventTypes.settlementCancelled,
    "SETTLEMENT",
    cancelled.id,
    source,
    actor,
    eventKey("SETTLEMENT_CANCEL", source.sourceType, sourceEntityId, cancelled.id),
  ));
  return { settlement: cancelled, eventId: event.id };
}

export async function cancelSettlementAfterPurchaseReceiptCancellation(
  db: Db,
  actor: FinanceActor,
  input: { purchaseReceiptId: string; settlementId: string },
) {
  const receipt = await db.purchaseReceipt.findUnique({
    where: { id: requiredText(input.purchaseReceiptId, "Recebimento") },
    select: { id: true, contractId: true },
  });
  if (!receipt) throw new ProcurementFinanceBridgeError("Recebimento não encontrado.");
  const cancellation = await cancelPurchaseReceiptLiquidationAuthorization(db, actor, receipt.id);
  if (!cancellation) throw new ProcurementFinanceBridgeError("Não existe AL de recebimento para anular.");
  return cancelSettlementForSource(db, actor, input.settlementId, { sourceType: "CONTRACT", sourceId: receipt.contractId }, receipt.id);
}

export async function cancelSettlementAfterInstrumentMeasurementCancellation(
  db: Db,
  actor: FinanceActor,
  input: { measurementId: string; settlementId: string },
) {
  const measurement = await db.instrumentMeasurement.findUnique({
    where: { id: requiredText(input.measurementId, "Medição") },
    select: { id: true, contractId: true, covenantId: true },
  });
  if (!measurement) throw new ProcurementFinanceBridgeError("Medição não encontrada.");
  const cancellation = await cancelInstrumentMeasurementLiquidationAuthorization(db, actor, measurement.id);
  if (!cancellation) throw new ProcurementFinanceBridgeError("Não existe AL de medição para anular.");
  return cancelSettlementForSource(db, actor, input.settlementId, sourceForMeasurement(measurement), measurement.id);
}
