"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  AccessError,
  assertBudgetUnitAccess,
  getTenantContextForModuleOperation,
  type AppContext,
} from "@/lib/platform/tenant-context";
import {
  ContractLifecycleError,
  assertDateWithinInstrumentValidity,
  assertEditableMeasurementStatus,
  assertInstrumentAggregateTotalWithinCurrentValue,
  assertLifecycleDateRange,
  assertMeasurementCanBeAttested,
  assertMeasurementStatusTransition,
  assertOptionalQuantityAndUnit,
  assertPositiveSequence,
  contractBudgetUnitIdsForMutation,
  isInstrumentInstallmentStatus,
  isInstrumentKind,
  isInstrumentMeasurementStatus,
  isInstrumentPartyStatus,
  isInstrumentResponsibilityGroupStatus,
  optionalLifecycleText,
  parseInstrumentPartyReference,
  parseOptionalLifecycleDate,
  requiredLifecycleText,
  type InstrumentKind,
} from "@/lib/compras/contract-lifecycle";
import {
  ProcurementFinanceBridgeError,
  cancelInstrumentMeasurementLiquidationAuthorization,
  recordInstrumentMeasurementLiquidationAuthorization,
} from "@/lib/compras/procurement-finance-bridge";
import { dispatchSiaficEvents } from "@/lib/siafic/dispatcher";
import { queueCovenantSnapshot } from "@/lib/siafic/source";

export type InstrumentActionResult = { success: true } | { success: false; error: string };

type Transaction = Prisma.TransactionClient;
type InstrumentReference = { kind: InstrumentKind; id: string };
type AuthorizedInstrument =
  | {
    kind: "CONTRACT";
    id: string;
    status: string;
    sourceBudgetUnitId: string | null;
    processId: string;
    startDate: Date;
    endDate: Date;
    currentValue: Prisma.Decimal;
    updatedAt: Date;
  }
  | {
    kind: "COVENANT";
    id: string;
    status: string;
    startDate: Date;
    endDate: Date;
    currentValue: Prisma.Decimal;
    updatedAt: Date;
  };

const activeMeasurementStatuses = ["Rascunho", "Em análise", "Atestada"];

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function formNumber(formData: FormData, name: string, label: string) {
  const value = formString(formData, name);
  if (!value) return null;
  const number = Number(value.replace(",", "."));
  if (!Number.isFinite(number)) throw new ContractLifecycleError(`Informe ${label.toLocaleLowerCase("pt-BR")} válido.`);
  return number;
}

function formDecimal(formData: FormData, name: string, label: string, options: { required?: boolean; positive?: boolean } = {}) {
  const value = formString(formData, name);
  const required = options.required !== false;
  if (!value) {
    if (required) throw new ContractLifecycleError(`Informe ${label.toLocaleLowerCase("pt-BR")}.`);
    return null;
  }
  if (!/^\d{1,16}(?:[.,]\d{1,2})?$/.test(value)) {
    throw new ContractLifecycleError(`Informe ${label.toLocaleLowerCase("pt-BR")} com até duas casas decimais.`);
  }
  const number = Number(value.replace(",", "."));
  if (!Number.isFinite(number) || number < 0 || (options.positive && number === 0)) {
    throw new ContractLifecycleError(`Informe ${label.toLocaleLowerCase("pt-BR")} ${options.positive ? "maior que zero" : "maior ou igual a zero"}.`);
  }
  return new Prisma.Decimal(value.replace(",", "."));
}

function actionFailure(error: unknown, fallback: string): InstrumentActionResult {
  if (error instanceof ContractLifecycleError || error instanceof ProcurementFinanceBridgeError || error instanceof AccessError) return { success: false, error: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { success: false, error: "Já existe um registro com os mesmos dados para este instrumento." };
  }
  console.error(fallback, error);
  return { success: false, error: fallback };
}

function referenceFromForm(formData: FormData): InstrumentReference {
  const kind = formString(formData, "instrumentType");
  const id = formString(formData, "instrumentId");
  if (!isInstrumentKind(kind) || !id) throw new ContractLifecycleError("Instrumento inválido.");
  return { kind, id };
}

function instrumentParentFields(reference: InstrumentReference) {
  return reference.kind === "CONTRACT"
    ? { contractId: reference.id, covenantId: null }
    : { contractId: null, covenantId: reference.id };
}

function assertChildBelongsToInstrument(reference: InstrumentReference, child: { contractId: string | null; covenantId: string | null }) {
  const belongsToContract = reference.kind === "CONTRACT" && child.contractId === reference.id && child.covenantId === null;
  const belongsToCovenant = reference.kind === "COVENANT" && child.covenantId === reference.id && child.contractId === null;
  if (!belongsToContract && !belongsToCovenant) throw new ContractLifecycleError("O registro não pertence ao instrumento informado.");
}

function idempotencyKey(formData: FormData, action: string, reference: InstrumentReference) {
  const key = formString(formData, "idempotencyKey");
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(key)) {
    throw new ContractLifecycleError("Não foi possível validar a repetição segura da ação. Atualize a página e tente novamente.");
  }
  return `${action}:${reference.kind}:${reference.id}:${key}`;
}

async function getAuthorizedInstrument(tx: Transaction, user: AppContext["user"], reference: InstrumentReference): Promise<AuthorizedInstrument> {
  if (reference.kind === "CONTRACT") {
    const contract = await tx.contract.findUnique({
      where: { id: reference.id },
      select: { id: true, status: true, sourceBudgetUnitId: true, processId: true, startDate: true, endDate: true, updatedValue: true, updatedAt: true },
    });
    if (!contract) throw new ContractLifecycleError("Contrato não encontrado.");

    const budgetUnitIds = contractBudgetUnitIdsForMutation(user, { currentSourceBudgetUnitId: contract.sourceBudgetUnitId });
    for (const budgetUnitId of budgetUnitIds) assertBudgetUnitAccess(user, budgetUnitId);
    return { kind: "CONTRACT", ...contract, currentValue: new Prisma.Decimal(contract.updatedValue) };
  }

  const covenant = await tx.covenant.findUnique({
    where: { id: reference.id },
    select: { id: true, status: true, startDate: true, endDate: true, totalValueDecimal: true, updatedAt: true },
  });
  if (!covenant) throw new ContractLifecycleError("Convênio não encontrado.");
  // Covenant has no source budget-unit field. Module authorization is the available ownership boundary.
  return { kind: "COVENANT", ...covenant, currentValue: new Prisma.Decimal(covenant.totalValueDecimal) };
}

function assertInstrumentWritable(instrument: AuthorizedInstrument) {
  if (["Encerrado", "Rescindido"].includes(instrument.status)) {
    throw new ContractLifecycleError(`${instrument.kind === "CONTRACT" ? "Contrato" : "Convênio"} encerrado ou rescindido não aceita novas alterações de execução.`);
  }
}

async function isRepeatedAction(
  tx: Transaction,
  key: string,
  reference: InstrumentReference,
  entityType: string,
) {
  const event = await tx.procurementLifecycleEvent.findUnique({
    where: { idempotencyKey: key },
    select: { entityType: true, sourceType: true, sourceId: true },
  });
  if (!event) return false;
  if (event.entityType !== entityType || event.sourceType !== reference.kind || event.sourceId !== reference.id) {
    throw new ContractLifecycleError("A chave de repetição já foi usada em outro ato do instrumento.");
  }
  return true;
}

async function recordInstrumentEvent(
  tx: Transaction,
  input: {
    eventType: string;
    entityType: string;
    entityId: string;
    reference: InstrumentReference;
    actorUsuarioId: string;
    idempotencyKey: string;
  },
) {
  await tx.procurementLifecycleEvent.create({
    data: {
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      sourceType: input.reference.kind,
      sourceId: input.reference.id,
      actorUsuarioId: input.actorUsuarioId,
      idempotencyKey: input.idempotencyKey,
    },
  });
}

function revalidateInstrumentPaths(reference: InstrumentReference) {
  const basePath = reference.kind === "CONTRACT" ? "/compras/contratos" : "/compras/convenios";
  revalidatePath(basePath);
  revalidatePath(`${basePath}/${reference.id}`);
  revalidatePath(`${basePath}/${reference.id}/editar`);
  revalidatePath(`${basePath}/${reference.id}/relatorio`);
}

async function queueCovenantSnapshotAfterInstrumentMutation(
  tx: Transaction,
  actorUsuarioId: string,
  reference: InstrumentReference,
) {
  if (reference.kind !== "COVENANT") return [];
  return queueCovenantSnapshot(tx, { usuarioId: actorUsuarioId }, reference.id, "UPDATE");
}

async function lockInstrumentExecution(tx: Transaction, instrument: AuthorizedInstrument) {
  const now = new Date();
  const updated = instrument.kind === "CONTRACT"
    ? await tx.contract.updateMany({ where: { id: instrument.id, updatedAt: instrument.updatedAt }, data: { updatedAt: now } })
    : await tx.covenant.updateMany({ where: { id: instrument.id, updatedAt: instrument.updatedAt }, data: { updatedAt: now } });
  if (updated.count !== 1) {
    throw new ContractLifecycleError("O instrumento foi alterado por outra operação. Atualize e tente novamente.");
  }
}

async function validateResponsibilityGroup(
  tx: Transaction,
  reference: InstrumentReference,
  responsibilityGroupId: string | null,
) {
  if (!responsibilityGroupId) return null;
  const group = await tx.instrumentResponsibilityGroup.findUnique({
    where: { id: responsibilityGroupId },
    select: { id: true, contractId: true, covenantId: true, status: true },
  });
  if (!group) throw new ContractLifecycleError("Grupo de responsabilidade não encontrado.");
  assertChildBelongsToInstrument(reference, group);
  if (group.status !== "Ativo") throw new ContractLifecycleError("Selecione um grupo de responsabilidade ativo.");
  return group.id;
}

async function validatePartyIdentity(tx: Transaction, value: string) {
  const identity = parseInstrumentPartyReference(value);
  if (identity.kind === "SUPPLIER") {
    const supplier = await tx.supplier.findUnique({ where: { id: identity.id }, select: { id: true, status: true } });
    if (!supplier || supplier.status !== "Ativo") throw new ContractLifecycleError("Selecione um fornecedor ativo.");
    return { supplierId: supplier.id, personId: null, companyId: null, employeeId: null };
  }
  if (identity.kind === "PERSON") {
    const person = await tx.person.findUnique({ where: { id: identity.id }, select: { id: true, status: true } });
    if (!person || person.status !== "Ativo") throw new ContractLifecycleError("Selecione uma pessoa ativa.");
    return { supplierId: null, personId: person.id, companyId: null, employeeId: null };
  }
  if (identity.kind === "COMPANY") {
    const company = await tx.company.findUnique({ where: { id: identity.id }, select: { id: true, status: true } });
    if (!company || company.status !== "Ativo") throw new ContractLifecycleError("Selecione uma empresa ativa.");
    return { supplierId: null, personId: null, companyId: company.id, employeeId: null };
  }
  const employee = await tx.employee.findUnique({ where: { id: identity.id }, select: { id: true, isActive: true } });
  if (!employee || !employee.isActive) throw new ContractLifecycleError("Selecione um servidor ativo.");
  return { supplierId: null, personId: null, companyId: null, employeeId: employee.id };
}

async function validatePurchaseProcessItem(
  tx: Transaction,
  instrument: AuthorizedInstrument,
  purchaseProcessItemId: string | null,
) {
  if (!purchaseProcessItemId) return null;
  if (instrument.kind !== "CONTRACT") {
    throw new ContractLifecycleError("Itens de processo só podem ser vinculados a medições de contrato.");
  }
  const item = await tx.purchaseProcessItem.findUnique({
    where: { id: purchaseProcessItemId },
    select: { id: true, purchaseProcessId: true },
  });
  if (!item || item.purchaseProcessId !== instrument.processId) {
    throw new ContractLifecycleError("O item informado não pertence ao processo do contrato.");
  }
  return item.id;
}

export async function saveInstrumentResponsibilityGroup(formData: FormData): Promise<InstrumentActionResult> {
  try {
    const reference = referenceFromForm(formData);
    const groupId = formString(formData, "groupId") || null;
    const name = requiredLifecycleText(formString(formData, "name"), "o nome do grupo", 160);
    const description = optionalLifecycleText(formString(formData, "description"), "a descrição", 1_000);
    const status = formString(formData, "status") || "Ativo";
    if (!isInstrumentResponsibilityGroupStatus(status)) return { success: false, error: "Situação do grupo inválida." };
    const key = idempotencyKey(formData, "INSTRUMENT_GROUP", reference);
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");

    const eventIds = await context.prisma.$transaction(async (tx) => {
      const instrument = await getAuthorizedInstrument(tx, context.user, reference);
      assertInstrumentWritable(instrument);
      if (await isRepeatedAction(tx, key, reference, "INSTRUMENT_RESPONSIBILITY_GROUP")) return [];

      const parent = instrumentParentFields(reference);
      const duplicate = await tx.instrumentResponsibilityGroup.findFirst({
        where: { ...parent, name, ...(groupId ? { id: { not: groupId } } : {}) },
        select: { id: true },
      });
      if (duplicate) throw new ContractLifecycleError("Já existe um grupo com esse nome neste instrumento.");

      if (groupId) {
        const existing = await tx.instrumentResponsibilityGroup.findUnique({
          where: { id: groupId },
          select: { id: true, contractId: true, covenantId: true, updatedAt: true },
        });
        if (!existing) throw new ContractLifecycleError("Grupo de responsabilidade não encontrado.");
        assertChildBelongsToInstrument(reference, existing);
        const updated = await tx.instrumentResponsibilityGroup.updateMany({
          where: { id: existing.id, updatedAt: existing.updatedAt, ...parent },
          data: { name, description, status },
        });
        if (updated.count !== 1) throw new ContractLifecycleError("O grupo foi alterado por outra operação. Atualize e tente novamente.");
        await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_RESPONSIBILITY_GROUP_UPDATED", entityType: "INSTRUMENT_RESPONSIBILITY_GROUP", entityId: existing.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
        return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
      }

      const created = await tx.instrumentResponsibilityGroup.create({ data: { ...parent, name, description, status } });
      await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_RESPONSIBILITY_GROUP_CREATED", entityType: "INSTRUMENT_RESPONSIBILITY_GROUP", entityId: created.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
      return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
    });

    await dispatchSiaficEvents(context.prisma, eventIds);
    revalidateInstrumentPaths(reference);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Não foi possível salvar o grupo de responsabilidade.");
  }
}

export async function deleteInstrumentResponsibilityGroup(formData: FormData): Promise<InstrumentActionResult> {
  try {
    const reference = referenceFromForm(formData);
    const groupId = requiredLifecycleText(formString(formData, "groupId"), "o grupo de responsabilidade", 200);
    const key = idempotencyKey(formData, "INSTRUMENT_GROUP_DELETE", reference);
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");

    const eventIds = await context.prisma.$transaction(async (tx) => {
      const instrument = await getAuthorizedInstrument(tx, context.user, reference);
      assertInstrumentWritable(instrument);
      if (await isRepeatedAction(tx, key, reference, "INSTRUMENT_RESPONSIBILITY_GROUP")) return [];

      const group = await tx.instrumentResponsibilityGroup.findUnique({
        where: { id: groupId },
        select: { id: true, contractId: true, covenantId: true, updatedAt: true, _count: { select: { members: true } } },
      });
      if (!group) throw new ContractLifecycleError("Grupo de responsabilidade não encontrado.");
      assertChildBelongsToInstrument(reference, group);
      if (group._count.members) throw new ContractLifecycleError("Remova ou reclassifique os membros do grupo antes de excluí-lo.");

      const deleted = await tx.instrumentResponsibilityGroup.deleteMany({
        where: { id: group.id, updatedAt: group.updatedAt, ...instrumentParentFields(reference) },
      });
      if (deleted.count !== 1) throw new ContractLifecycleError("O grupo foi alterado por outra operação. Atualize e tente novamente.");
      await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_RESPONSIBILITY_GROUP_DELETED", entityType: "INSTRUMENT_RESPONSIBILITY_GROUP", entityId: group.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
      return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
    });

    await dispatchSiaficEvents(context.prisma, eventIds);
    revalidateInstrumentPaths(reference);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Não foi possível excluir o grupo de responsabilidade.");
  }
}

export async function saveInstrumentParty(formData: FormData): Promise<InstrumentActionResult> {
  try {
    const reference = referenceFromForm(formData);
    const partyId = formString(formData, "partyId") || null;
    const role = requiredLifecycleText(formString(formData, "role"), "o papel da parte", 120);
    const status = formString(formData, "status") || "Ativo";
    if (!isInstrumentPartyStatus(status)) return { success: false, error: "Situação da parte inválida." };
    const activeFrom = parseOptionalLifecycleDate(formString(formData, "activeFrom"), "Data inicial da parte");
    const activeTo = parseOptionalLifecycleDate(formString(formData, "activeTo"), "Data final da parte");
    assertLifecycleDateRange(activeFrom, activeTo, "data inicial da parte", "A data final da parte");
    const notes = optionalLifecycleText(formString(formData, "notes"), "as observações", 2_000);
    const key = idempotencyKey(formData, "INSTRUMENT_PARTY", reference);
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");

    const eventIds = await context.prisma.$transaction(async (tx) => {
      const instrument = await getAuthorizedInstrument(tx, context.user, reference);
      assertInstrumentWritable(instrument);
      if (await isRepeatedAction(tx, key, reference, "INSTRUMENT_PARTY")) return [];

      const [identity, responsibilityGroupId] = await Promise.all([
        validatePartyIdentity(tx, formString(formData, "partyReference")),
        validateResponsibilityGroup(tx, reference, formString(formData, "responsibilityGroupId") || null),
      ]);
      const data = { role, ...identity, responsibilityGroupId, status, activeFrom, activeTo, notes };
      const parent = instrumentParentFields(reference);

      if (partyId) {
        const existing = await tx.instrumentParty.findUnique({
          where: { id: partyId },
          select: { id: true, contractId: true, covenantId: true, updatedAt: true },
        });
        if (!existing) throw new ContractLifecycleError("Parte do instrumento não encontrada.");
        assertChildBelongsToInstrument(reference, existing);
        const updated = await tx.instrumentParty.updateMany({
          where: { id: existing.id, updatedAt: existing.updatedAt, ...parent },
          data,
        });
        if (updated.count !== 1) throw new ContractLifecycleError("A parte foi alterada por outra operação. Atualize e tente novamente.");
        await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_PARTY_UPDATED", entityType: "INSTRUMENT_PARTY", entityId: existing.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
        return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
      }

      const created = await tx.instrumentParty.create({ data: { ...parent, ...data } });
      await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_PARTY_CREATED", entityType: "INSTRUMENT_PARTY", entityId: created.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
      return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
    });

    await dispatchSiaficEvents(context.prisma, eventIds);
    revalidateInstrumentPaths(reference);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Não foi possível salvar a parte do instrumento.");
  }
}

export async function deleteInstrumentParty(formData: FormData): Promise<InstrumentActionResult> {
  try {
    const reference = referenceFromForm(formData);
    const partyId = requiredLifecycleText(formString(formData, "partyId"), "a parte do instrumento", 200);
    const key = idempotencyKey(formData, "INSTRUMENT_PARTY_DELETE", reference);
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");

    const eventIds = await context.prisma.$transaction(async (tx) => {
      const instrument = await getAuthorizedInstrument(tx, context.user, reference);
      assertInstrumentWritable(instrument);
      if (await isRepeatedAction(tx, key, reference, "INSTRUMENT_PARTY")) return [];

      const party = await tx.instrumentParty.findUnique({
        where: { id: partyId },
        select: { id: true, contractId: true, covenantId: true, updatedAt: true },
      });
      if (!party) throw new ContractLifecycleError("Parte do instrumento não encontrada.");
      assertChildBelongsToInstrument(reference, party);

      const deleted = await tx.instrumentParty.deleteMany({
        where: { id: party.id, updatedAt: party.updatedAt, ...instrumentParentFields(reference) },
      });
      if (deleted.count !== 1) throw new ContractLifecycleError("A parte foi alterada por outra operação. Atualize e tente novamente.");
      await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_PARTY_DELETED", entityType: "INSTRUMENT_PARTY", entityId: party.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
      return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
    });

    await dispatchSiaficEvents(context.prisma, eventIds);
    revalidateInstrumentPaths(reference);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Não foi possível excluir a parte do instrumento.");
  }
}

function measurementInput(formData: FormData) {
  const number = assertPositiveSequence(formNumber(formData, "number", "Número da medição"), "O número da medição");
  const description = optionalLifecycleText(formString(formData, "description"), "a descrição", 1_000);
  const periodStart = parseOptionalLifecycleDate(formString(formData, "periodStart"), "Data inicial do período");
  const periodEnd = parseOptionalLifecycleDate(formString(formData, "periodEnd"), "Data final do período");
  assertLifecycleDateRange(periodStart, periodEnd, "data inicial do período", "A data final do período");
  const measuredAt = parseOptionalLifecycleDate(formString(formData, "measuredAt"), "Data da medição");
  if (!measuredAt) throw new ContractLifecycleError("Informe a data da medição.");
  const { quantity, unit } = assertOptionalQuantityAndUnit(formNumber(formData, "quantity", "Quantidade"), formString(formData, "unit"), "A medição");
  const valueDecimal = formDecimal(formData, "valueDecimal", "o valor da medição");
  if (!valueDecimal) throw new ContractLifecycleError("Informe o valor da medição.");
  const status = formString(formData, "status") || "Rascunho";
  if (!isInstrumentMeasurementStatus(status)) throw new ContractLifecycleError("Situação da medição inválida.");
  const documentId = formString(formData, "documentId") || null;
  return { number, description, periodStart, periodEnd, measuredAt, quantity, unit, valueDecimal, status, documentId };
}

function assertMeasurementDatesWithinInstrumentValidity(
  data: ReturnType<typeof measurementInput>,
  instrument: AuthorizedInstrument,
) {
  assertDateWithinInstrumentValidity(data.measuredAt, instrument.startDate, instrument.endDate, "A data da medição");
  if (data.periodStart) assertDateWithinInstrumentValidity(data.periodStart, instrument.startDate, instrument.endDate, "A data inicial do período");
  if (data.periodEnd) assertDateWithinInstrumentValidity(data.periodEnd, instrument.startDate, instrument.endDate, "A data final do período");
}

async function validateMeasurementDocument(tx: Transaction, documentId: string | null, currentDocumentId: string | null = null) {
  if (!documentId || documentId === currentDocumentId) return documentId;
  const document = await tx.document.findFirst({
    where: { id: documentId, status: "Válido", documentType: { not: "Modelo" } },
    select: { id: true },
  });
  if (!document) throw new ContractLifecycleError("Selecione um documento GED válido.");
  return document.id;
}

async function assertMeasurementAggregateWithinInstrumentValue(
  tx: Transaction,
  reference: InstrumentReference,
  instrument: AuthorizedInstrument,
  measurementId: string | null,
  data: ReturnType<typeof measurementInput>,
) {
  const aggregate = await tx.instrumentMeasurement.aggregate({
    where: {
      ...instrumentParentFields(reference),
      ...(measurementId ? { id: { not: measurementId } } : {}),
      status: { in: activeMeasurementStatuses },
    },
    _sum: { valueDecimal: true },
  });
  const total = new Prisma.Decimal(aggregate._sum.valueDecimal ?? 0).plus(
    activeMeasurementStatuses.includes(data.status) ? data.valueDecimal : 0,
  );
  assertInstrumentAggregateTotalWithinCurrentValue(instrument.currentValue, total, "medições ativas");
}

async function assertAttestedMeasurementCancellationIsFinanciallySafe(
  tx: Transaction,
  reference: InstrumentReference,
  measurementId: string,
) {
  const settlement = await tx.settlement.findFirst({
    where: {
      documentRef: `AL-MED-${measurementId}`,
      commitment: reference.kind === "CONTRACT" ? { contractId: reference.id } : { covenantId: reference.id },
      OR: [
        { status: { not: "Cancelado" } },
        { payments: { some: { status: { not: "Cancelado" } } } },
      ],
    },
    select: { id: true },
  });
  if (settlement) {
    throw new ContractLifecycleError("A medição atestada possui liquidação financeira ativa e não pode ser cancelada.");
  }
}

function cancellationDescription(description: string | null, reason: string) {
  const entry = `Cancelamento: ${reason}`;
  const value = description ? `${description}\n\n${entry}` : entry;
  if (value.length > 1_000) {
    throw new ContractLifecycleError("A descrição existente não comporta a justificativa do cancelamento.");
  }
  return value;
}

export async function saveInstrumentMeasurement(formData: FormData): Promise<InstrumentActionResult> {
  try {
    const reference = referenceFromForm(formData);
    const measurementId = formString(formData, "measurementId") || null;
    const requestedStatus = formString(formData, "status") || "Rascunho";
    const requestedData = measurementId && requestedStatus === "Cancelada" ? null : measurementInput(formData);
    if (!measurementId && requestedData!.status !== "Rascunho") return { success: false, error: "Uma nova medição deve iniciar como rascunho." };
    const key = idempotencyKey(formData, "INSTRUMENT_MEASUREMENT", reference);
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");

    const eventIds = await context.prisma.$transaction(async (tx) => {
      const instrument = await getAuthorizedInstrument(tx, context.user, reference);
      assertInstrumentWritable(instrument);
      if (await isRepeatedAction(tx, key, reference, "INSTRUMENT_MEASUREMENT")) return [];

      const parent = instrumentParentFields(reference);
      if (measurementId) {
        const existing = await tx.instrumentMeasurement.findUnique({
          where: { id: measurementId },
          select: {
            id: true,
            contractId: true,
            covenantId: true,
            number: true,
            description: true,
            periodStart: true,
            periodEnd: true,
            measuredAt: true,
            status: true,
            quantity: true,
            unit: true,
            valueDecimal: true,
            documentId: true,
            updatedAt: true,
            items: { select: { valueDecimal: true } },
          },
        });
        if (!existing) throw new ContractLifecycleError("Medição não encontrada.");
        assertChildBelongsToInstrument(reference, existing);
        assertMeasurementStatusTransition(existing.status, requestedStatus);
        const isCancellation = requestedStatus === "Cancelada";
        if (existing.status === "Cancelada") throw new ContractLifecycleError("Uma medição cancelada não aceita novas alterações.");
        if (existing.status === "Atestada" && !isCancellation) {
          throw new ContractLifecycleError("Uma medição atestada só pode ser cancelada para preservar sua evidência.");
        }

        const data = isCancellation
          ? {
            number: existing.number,
            description: cancellationDescription(
              existing.description,
              requiredLifecycleText(formString(formData, "cancellationReason"), "a justificativa do cancelamento", 700),
            ),
            periodStart: existing.periodStart,
            periodEnd: existing.periodEnd,
            measuredAt: existing.measuredAt,
            quantity: existing.quantity,
            unit: existing.unit,
            valueDecimal: existing.valueDecimal,
            status: "Cancelada",
            documentId: existing.documentId,
          }
          : {
            ...requestedData!,
            documentId: await validateMeasurementDocument(tx, requestedData!.documentId, existing.documentId),
          };

        if (isCancellation && existing.status === "Atestada") {
          await assertAttestedMeasurementCancellationIsFinanciallySafe(tx, reference, existing.id);
        }
        if (!isCancellation) {
          const duplicate = await tx.instrumentMeasurement.findFirst({
            where: { ...parent, number: data.number, id: { not: existing.id } },
            select: { id: true },
          });
          if (duplicate) throw new ContractLifecycleError("Já existe uma medição com esse número neste instrumento.");
          assertMeasurementDatesWithinInstrumentValidity(data, instrument);
          if (data.status === "Atestada") {
            assertMeasurementCanBeAttested({
              quantity: data.quantity,
              unit: data.unit,
              value: Number(data.valueDecimal),
              itemCount: existing.items.length,
              itemValueTotal: existing.items.reduce((total, item) => total + Number(item.valueDecimal), 0),
            });
          }
          await lockInstrumentExecution(tx, instrument);
          await assertMeasurementAggregateWithinInstrumentValue(tx, reference, instrument, existing.id, data);
        }
        const updated = await tx.instrumentMeasurement.updateMany({
          where: { id: existing.id, updatedAt: existing.updatedAt, ...parent },
          data,
        });
        if (updated.count !== 1) throw new ContractLifecycleError("A medição foi alterada por outra operação. Atualize e tente novamente.");
        await recordInstrumentEvent(tx, { eventType: isCancellation ? "INSTRUMENT_MEASUREMENT_CANCELLED" : "INSTRUMENT_MEASUREMENT_UPDATED", entityType: "INSTRUMENT_MEASUREMENT", entityId: existing.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
        return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
      }

      const data = {
        ...requestedData!,
        documentId: await validateMeasurementDocument(tx, requestedData!.documentId),
      };
      const duplicate = await tx.instrumentMeasurement.findFirst({
        where: { ...parent, number: data.number },
        select: { id: true },
      });
      if (duplicate) throw new ContractLifecycleError("Já existe uma medição com esse número neste instrumento.");
      assertMeasurementDatesWithinInstrumentValidity(data, instrument);
      await lockInstrumentExecution(tx, instrument);
      await assertMeasurementAggregateWithinInstrumentValue(tx, reference, instrument, null, data);
      const created = await tx.instrumentMeasurement.create({ data: { ...parent, ...data } });
      await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_MEASUREMENT_CREATED", entityType: "INSTRUMENT_MEASUREMENT", entityId: created.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
      return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
    });

    // A repeated request also retries the append-only AL candidate after a prior transient failure.
    if (measurementId) {
      if (requestedStatus === "Cancelada") {
        await cancelInstrumentMeasurementLiquidationAuthorization(
          context.prisma,
          { usuarioId: context.user.id, employeeId: context.user.employeeId },
          measurementId,
        );
      } else {
        await recordInstrumentMeasurementLiquidationAuthorization(
          context.prisma,
          { usuarioId: context.user.id, employeeId: context.user.employeeId },
          measurementId,
        );
      }
    }

    await dispatchSiaficEvents(context.prisma, eventIds);
    revalidateInstrumentPaths(reference);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Não foi possível salvar a medição.");
  }
}

export async function deleteInstrumentMeasurement(formData: FormData): Promise<InstrumentActionResult> {
  try {
    const reference = referenceFromForm(formData);
    const measurementId = requiredLifecycleText(formString(formData, "measurementId"), "a medição", 200);
    const key = idempotencyKey(formData, "INSTRUMENT_MEASUREMENT_DELETE", reference);
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");

    const eventIds = await context.prisma.$transaction(async (tx) => {
      const instrument = await getAuthorizedInstrument(tx, context.user, reference);
      assertInstrumentWritable(instrument);
      if (await isRepeatedAction(tx, key, reference, "INSTRUMENT_MEASUREMENT")) return [];

      const measurement = await tx.instrumentMeasurement.findUnique({
        where: { id: measurementId },
        select: { id: true, contractId: true, covenantId: true, status: true, updatedAt: true, _count: { select: { items: true } } },
      });
      if (!measurement) throw new ContractLifecycleError("Medição não encontrada.");
      assertChildBelongsToInstrument(reference, measurement);
      if (measurement.status !== "Rascunho") throw new ContractLifecycleError("Somente medições em rascunho podem ser excluídas. Cancele os demais registros para preservar o histórico.");
      if (measurement._count.items) throw new ContractLifecycleError("Exclua os itens da medição antes de excluir o cabeçalho.");

      const deleted = await tx.instrumentMeasurement.deleteMany({
        where: { id: measurement.id, updatedAt: measurement.updatedAt, ...instrumentParentFields(reference) },
      });
      if (deleted.count !== 1) throw new ContractLifecycleError("A medição foi alterada por outra operação. Atualize e tente novamente.");
      await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_MEASUREMENT_DELETED", entityType: "INSTRUMENT_MEASUREMENT", entityId: measurement.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
      return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
    });

    await dispatchSiaficEvents(context.prisma, eventIds);
    revalidateInstrumentPaths(reference);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Não foi possível excluir a medição.");
  }
}

function measurementItemInput(formData: FormData) {
  const description = requiredLifecycleText(formString(formData, "description"), "a descrição do item", 1_000);
  const quantity = formNumber(formData, "quantity", "Quantidade do item");
  if (quantity === null || quantity <= 0) throw new ContractLifecycleError("Informe uma quantidade do item maior que zero.");
  const unit = requiredLifecycleText(formString(formData, "unit"), "a unidade do item", 40);
  const unitValueDecimal = formDecimal(formData, "unitValueDecimal", "o valor unitário", { required: false });
  const valueDecimal = formDecimal(formData, "valueDecimal", "o valor do item");
  if (!valueDecimal) throw new ContractLifecycleError("Informe o valor do item.");
  return { description, quantity, unit, unitValueDecimal, valueDecimal };
}

async function measurementForItem(
  tx: Transaction,
  reference: InstrumentReference,
  measurementId: string,
) {
  const measurement = await tx.instrumentMeasurement.findUnique({
    where: { id: measurementId },
    select: { id: true, contractId: true, covenantId: true, status: true },
  });
  if (!measurement) throw new ContractLifecycleError("Medição não encontrada.");
  assertChildBelongsToInstrument(reference, measurement);
  assertEditableMeasurementStatus(measurement.status);
  return measurement;
}

export async function saveInstrumentMeasurementItem(formData: FormData): Promise<InstrumentActionResult> {
  try {
    const reference = referenceFromForm(formData);
    const measurementId = requiredLifecycleText(formString(formData, "measurementId"), "a medição", 200);
    const itemId = formString(formData, "measurementItemId") || null;
    const data = measurementItemInput(formData);
    const key = idempotencyKey(formData, "INSTRUMENT_MEASUREMENT_ITEM", reference);
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");

    const eventIds = await context.prisma.$transaction(async (tx) => {
      const instrument = await getAuthorizedInstrument(tx, context.user, reference);
      assertInstrumentWritable(instrument);
      if (await isRepeatedAction(tx, key, reference, "INSTRUMENT_MEASUREMENT_ITEM")) return [];
      await measurementForItem(tx, reference, measurementId);
      const purchaseProcessItemId = await validatePurchaseProcessItem(tx, instrument, formString(formData, "purchaseProcessItemId") || null);

      if (itemId) {
        const existing = await tx.instrumentMeasurementItem.findUnique({
          where: { id: itemId },
          select: { id: true, measurementId: true, purchaseReceiptItemId: true, updatedAt: true },
        });
        if (!existing || existing.measurementId !== measurementId) throw new ContractLifecycleError("Item de medição não encontrado.");
        if (existing.purchaseReceiptItemId) throw new ContractLifecycleError("Item vinculado a recebimento material só pode ser consultado neste módulo.");
        const updated = await tx.instrumentMeasurementItem.updateMany({
          where: { id: existing.id, measurementId, updatedAt: existing.updatedAt },
          data: { ...data, purchaseProcessItemId },
        });
        if (updated.count !== 1) throw new ContractLifecycleError("O item foi alterado por outra operação. Atualize e tente novamente.");
        await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_MEASUREMENT_ITEM_UPDATED", entityType: "INSTRUMENT_MEASUREMENT_ITEM", entityId: existing.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
        return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
      }

      const created = await tx.instrumentMeasurementItem.create({ data: { measurementId, ...data, purchaseProcessItemId } });
      await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_MEASUREMENT_ITEM_CREATED", entityType: "INSTRUMENT_MEASUREMENT_ITEM", entityId: created.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
      return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
    });

    await dispatchSiaficEvents(context.prisma, eventIds);
    revalidateInstrumentPaths(reference);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Não foi possível salvar o item da medição.");
  }
}

export async function deleteInstrumentMeasurementItem(formData: FormData): Promise<InstrumentActionResult> {
  try {
    const reference = referenceFromForm(formData);
    const measurementId = requiredLifecycleText(formString(formData, "measurementId"), "a medição", 200);
    const itemId = requiredLifecycleText(formString(formData, "measurementItemId"), "o item da medição", 200);
    const key = idempotencyKey(formData, "INSTRUMENT_MEASUREMENT_ITEM_DELETE", reference);
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");

    const eventIds = await context.prisma.$transaction(async (tx) => {
      const instrument = await getAuthorizedInstrument(tx, context.user, reference);
      assertInstrumentWritable(instrument);
      if (await isRepeatedAction(tx, key, reference, "INSTRUMENT_MEASUREMENT_ITEM")) return [];
      await measurementForItem(tx, reference, measurementId);

      const item = await tx.instrumentMeasurementItem.findUnique({
        where: { id: itemId },
        select: { id: true, measurementId: true, purchaseReceiptItemId: true, updatedAt: true },
      });
      if (!item || item.measurementId !== measurementId) throw new ContractLifecycleError("Item de medição não encontrado.");
      if (item.purchaseReceiptItemId) throw new ContractLifecycleError("Item vinculado a recebimento material só pode ser consultado neste módulo.");
      const deleted = await tx.instrumentMeasurementItem.deleteMany({
        where: { id: item.id, measurementId, updatedAt: item.updatedAt },
      });
      if (deleted.count !== 1) throw new ContractLifecycleError("O item foi alterado por outra operação. Atualize e tente novamente.");
      await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_MEASUREMENT_ITEM_DELETED", entityType: "INSTRUMENT_MEASUREMENT_ITEM", entityId: item.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
      return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
    });

    await dispatchSiaficEvents(context.prisma, eventIds);
    revalidateInstrumentPaths(reference);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Não foi possível excluir o item da medição.");
  }
}

function installmentInput(formData: FormData) {
  const number = assertPositiveSequence(formNumber(formData, "number", "Número da parcela"), "O número da parcela");
  const dueDate = parseOptionalLifecycleDate(formString(formData, "dueDate"), "Data prevista de vencimento");
  if (!dueDate) throw new ContractLifecycleError("Informe a data prevista de vencimento.");
  const periodStart = parseOptionalLifecycleDate(formString(formData, "periodStart"), "Data inicial do período");
  const periodEnd = parseOptionalLifecycleDate(formString(formData, "periodEnd"), "Data final do período");
  assertLifecycleDateRange(periodStart, periodEnd, "data inicial do período", "A data final do período");
  const { quantity, unit } = assertOptionalQuantityAndUnit(formNumber(formData, "quantity", "Quantidade"), formString(formData, "unit"), "A parcela");
  const valueDecimal = formDecimal(formData, "valueDecimal", "o valor da parcela", { positive: true });
  if (!valueDecimal) throw new ContractLifecycleError("Informe o valor da parcela.");
  const status = formString(formData, "status") || "Programada";
  if (!isInstrumentInstallmentStatus(status)) throw new ContractLifecycleError("Situação da parcela inválida.");
  return { number, dueDate, periodStart, periodEnd, quantity, unit, valueDecimal, status };
}

function assertInstallmentDueDateWithinInstrumentValidity(
  data: ReturnType<typeof installmentInput>,
  instrument: AuthorizedInstrument,
) {
  assertDateWithinInstrumentValidity(data.dueDate, instrument.startDate, instrument.endDate, "A data prevista de vencimento");
}

async function assertInstallmentAggregateWithinInstrumentValue(
  tx: Transaction,
  reference: InstrumentReference,
  instrument: AuthorizedInstrument,
  installmentId: string | null,
  data: ReturnType<typeof installmentInput>,
) {
  const aggregate = await tx.instrumentInstallment.aggregate({
    where: {
      ...instrumentParentFields(reference),
      ...(installmentId ? { id: { not: installmentId } } : {}),
      status: "Programada",
    },
    _sum: { valueDecimal: true },
  });
  const total = new Prisma.Decimal(aggregate._sum.valueDecimal ?? 0).plus(
    data.status === "Programada" ? data.valueDecimal : 0,
  );
  assertInstrumentAggregateTotalWithinCurrentValue(instrument.currentValue, total, "parcelas programadas");
}

export async function saveInstrumentInstallment(formData: FormData): Promise<InstrumentActionResult> {
  try {
    const reference = referenceFromForm(formData);
    const installmentId = formString(formData, "installmentId") || null;
    const data = installmentInput(formData);
    if (!installmentId && data.status !== "Programada") return { success: false, error: "Uma nova parcela deve iniciar como programada." };
    const key = idempotencyKey(formData, "INSTRUMENT_INSTALLMENT", reference);
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");

    const eventIds = await context.prisma.$transaction(async (tx) => {
      const instrument = await getAuthorizedInstrument(tx, context.user, reference);
      assertInstrumentWritable(instrument);
      if (await isRepeatedAction(tx, key, reference, "INSTRUMENT_INSTALLMENT")) return [];

      const parent = instrumentParentFields(reference);
      const duplicate = await tx.instrumentInstallment.findFirst({
        where: { ...parent, number: data.number, ...(installmentId ? { id: { not: installmentId } } : {}) },
        select: { id: true },
      });
      if (duplicate) throw new ContractLifecycleError("Já existe uma parcela com esse número neste instrumento.");
      assertInstallmentDueDateWithinInstrumentValidity(data, instrument);
      await lockInstrumentExecution(tx, instrument);

      if (installmentId) {
        const existing = await tx.instrumentInstallment.findUnique({
          where: { id: installmentId },
          select: { id: true, contractId: true, covenantId: true, paymentId: true, updatedAt: true },
        });
        if (!existing) throw new ContractLifecycleError("Parcela não encontrada.");
        assertChildBelongsToInstrument(reference, existing);
        if (existing.paymentId) throw new ContractLifecycleError("Uma parcela vinculada a pagamento real só pode ser consultada neste módulo.");
        await assertInstallmentAggregateWithinInstrumentValue(tx, reference, instrument, existing.id, data);
        const updated = await tx.instrumentInstallment.updateMany({
          where: { id: existing.id, updatedAt: existing.updatedAt, ...parent },
          data,
        });
        if (updated.count !== 1) throw new ContractLifecycleError("A parcela foi alterada por outra operação. Atualize e tente novamente.");
        await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_INSTALLMENT_UPDATED", entityType: "INSTRUMENT_INSTALLMENT", entityId: existing.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
        return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
      }

      await assertInstallmentAggregateWithinInstrumentValue(tx, reference, instrument, null, data);
      const created = await tx.instrumentInstallment.create({ data: { ...parent, ...data } });
      await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_INSTALLMENT_CREATED", entityType: "INSTRUMENT_INSTALLMENT", entityId: created.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
      return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
    });

    await dispatchSiaficEvents(context.prisma, eventIds);
    revalidateInstrumentPaths(reference);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Não foi possível salvar a parcela programada.");
  }
}

export async function deleteInstrumentInstallment(formData: FormData): Promise<InstrumentActionResult> {
  try {
    const reference = referenceFromForm(formData);
    const installmentId = requiredLifecycleText(formString(formData, "installmentId"), "a parcela", 200);
    const key = idempotencyKey(formData, "INSTRUMENT_INSTALLMENT_DELETE", reference);
    const context = await getTenantContextForModuleOperation("COMPRAS", "update");

    const eventIds = await context.prisma.$transaction(async (tx) => {
      const instrument = await getAuthorizedInstrument(tx, context.user, reference);
      assertInstrumentWritable(instrument);
      if (await isRepeatedAction(tx, key, reference, "INSTRUMENT_INSTALLMENT")) return [];

      const installment = await tx.instrumentInstallment.findUnique({
        where: { id: installmentId },
        select: { id: true, contractId: true, covenantId: true, paymentId: true, updatedAt: true },
      });
      if (!installment) throw new ContractLifecycleError("Parcela não encontrada.");
      assertChildBelongsToInstrument(reference, installment);
      if (installment.paymentId) throw new ContractLifecycleError("Uma parcela vinculada a pagamento real não pode ser excluída neste módulo.");

      const deleted = await tx.instrumentInstallment.deleteMany({
        where: { id: installment.id, updatedAt: installment.updatedAt, ...instrumentParentFields(reference) },
      });
      if (deleted.count !== 1) throw new ContractLifecycleError("A parcela foi alterada por outra operação. Atualize e tente novamente.");
      await recordInstrumentEvent(tx, { eventType: "INSTRUMENT_INSTALLMENT_DELETED", entityType: "INSTRUMENT_INSTALLMENT", entityId: installment.id, reference, actorUsuarioId: context.user.id, idempotencyKey: key });
      return queueCovenantSnapshotAfterInstrumentMutation(tx, context.user.id, reference);
    });

    await dispatchSiaficEvents(context.prisma, eventIds);
    revalidateInstrumentPaths(reference);
    return { success: true };
  } catch (error) {
    return actionFailure(error, "Não foi possível excluir a parcela programada.");
  }
}
