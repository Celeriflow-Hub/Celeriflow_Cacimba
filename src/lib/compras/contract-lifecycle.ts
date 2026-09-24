import { SYSTEM_ADMIN_PROFILE_CODE } from "@/lib/administration/c3-policy";

export const contractAmendmentTypes = ["Prazo", "Valor", "Ambos", "Suspensão", "Rescisão"] as const;

export type ContractAmendmentType = (typeof contractAmendmentTypes)[number];

export class ContractLifecycleError extends Error {}

export type ContractBudgetUnitScope = {
  profileCode: string;
  allowedBudgetUnitIds: readonly string[];
};

type ContractBudgetUnitMutation = {
  // undefined means a new contract; null means an existing legacy contract without a UG.
  currentSourceBudgetUnitId?: string | null;
  requestedSourceBudgetUnitId?: string | null;
};

function normalizedBudgetUnitId(value: string | null | undefined) {
  return value?.trim() || null;
}

export function contractBudgetUnitIdsForMutation(user: ContractBudgetUnitScope, input: ContractBudgetUnitMutation) {
  const currentSourceBudgetUnitId = normalizedBudgetUnitId(input.currentSourceBudgetUnitId);
  const requestedSourceBudgetUnitId = normalizedBudgetUnitId(input.requestedSourceBudgetUnitId);
  const isAdministrator = user.profileCode === SYSTEM_ADMIN_PROFILE_CODE;

  if (input.currentSourceBudgetUnitId !== undefined && !currentSourceBudgetUnitId && !isAdministrator) {
    throw new ContractLifecycleError("Contratos legados sem Unidade Gestora de origem só podem ser alterados ou excluídos por administrador do sistema.");
  }

  const budgetUnitIds = [...new Set([currentSourceBudgetUnitId, requestedSourceBudgetUnitId].filter((id): id is string => Boolean(id)))];
  if (!isAdministrator && budgetUnitIds.some((budgetUnitId) => !user.allowedBudgetUnitIds.includes(budgetUnitId))) {
    throw new ContractLifecycleError("Acesso negado a uma Unidade Gestora vinculada ao contrato.");
  }

  return budgetUnitIds;
}

function utcCalendarDay(date: Date) {
  if (Number.isNaN(date.valueOf())) throw new ContractLifecycleError("Data contratual inválida.");
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function calculateInclusiveContractTermDays(startDate: Date, endDate: Date) {
  const start = utcCalendarDay(startDate);
  const end = utcCalendarDay(endDate);
  if (end < start) throw new ContractLifecycleError("A data final não pode ser anterior à data inicial.");
  return Math.floor((end - start) / 86_400_000) + 1;
}

export function parseContractDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value ? null : parsed;
}

export function isContractAmendmentType(value: string): value is ContractAmendmentType {
  return contractAmendmentTypes.includes(value as ContractAmendmentType);
}

export type ContractAmendmentBaseline = {
  updatedValue: number;
  startDate: Date;
  endDate: Date;
};

export type ContractAmendmentEffect = {
  previousValue: number | null;
  newValue: number | null;
  previousEndDate: Date | null;
  newEndDate: Date | null;
  contractUpdate: { updatedValue?: number; endDate?: Date; status?: "Suspenso" | "Rescindido" };
  lifecycleEventType: string;
};

export function resolveContractAmendmentEffect(
  baseline: ContractAmendmentBaseline,
  input: { type: ContractAmendmentType; newValue?: number; newEndDate?: Date },
): ContractAmendmentEffect {
  const changesValue = input.type === "Valor" || input.type === "Ambos";
  const changesTerm = input.type === "Prazo" || input.type === "Ambos";

  if (changesValue && (!Number.isFinite(input.newValue) || input.newValue! < 0)) {
    throw new ContractLifecycleError("Informe o novo valor total do contrato.");
  }
  if (changesTerm && (!input.newEndDate || Number.isNaN(input.newEndDate.valueOf()) || input.newEndDate < baseline.startDate)) {
    throw new ContractLifecycleError("Informe uma nova data final válida para o contrato.");
  }

  if (input.type === "Suspensão") {
    return {
      previousValue: null,
      newValue: null,
      previousEndDate: null,
      newEndDate: null,
      contractUpdate: { status: "Suspenso" },
      lifecycleEventType: "CONTRACT_SUSPENSION_REGISTERED",
    };
  }
  if (input.type === "Rescisão") {
    return {
      previousValue: null,
      newValue: null,
      previousEndDate: null,
      newEndDate: null,
      contractUpdate: { status: "Rescindido" },
      lifecycleEventType: "CONTRACT_RESCISSION_REGISTERED",
    };
  }

  return {
    previousValue: changesValue ? baseline.updatedValue : null,
    newValue: changesValue ? input.newValue! : null,
    previousEndDate: changesTerm ? baseline.endDate : null,
    newEndDate: changesTerm ? input.newEndDate! : null,
    contractUpdate: {
      ...(changesValue ? { updatedValue: input.newValue! } : {}),
      ...(changesTerm ? { endDate: input.newEndDate! } : {}),
    },
    lifecycleEventType: "CONTRACT_AMENDMENT_APPLIED",
  };
}

export const instrumentKinds = ["CONTRACT", "COVENANT"] as const;
export const instrumentResponsibilityGroupStatuses = ["Ativo", "Inativo"] as const;
export const instrumentPartyStatuses = ["Ativo", "Inativo"] as const;
export const instrumentMeasurementStatuses = ["Rascunho", "Em análise", "Atestada", "Rejeitada", "Cancelada"] as const;
export const instrumentInstallmentStatuses = ["Programada", "Cancelada"] as const;
export const instrumentPartyReferenceKinds = ["SUPPLIER", "PERSON", "COMPANY", "EMPLOYEE"] as const;

export type InstrumentKind = (typeof instrumentKinds)[number];
export type InstrumentPartyReferenceKind = (typeof instrumentPartyReferenceKinds)[number];

export function isInstrumentKind(value: string): value is InstrumentKind {
  return instrumentKinds.includes(value as InstrumentKind);
}

export function isInstrumentResponsibilityGroupStatus(value: string) {
  return instrumentResponsibilityGroupStatuses.includes(value as (typeof instrumentResponsibilityGroupStatuses)[number]);
}

export function isInstrumentPartyStatus(value: string) {
  return instrumentPartyStatuses.includes(value as (typeof instrumentPartyStatuses)[number]);
}

export function isInstrumentMeasurementStatus(value: string) {
  return instrumentMeasurementStatuses.includes(value as (typeof instrumentMeasurementStatuses)[number]);
}

export function isInstrumentInstallmentStatus(value: string) {
  return instrumentInstallmentStatuses.includes(value as (typeof instrumentInstallmentStatuses)[number]);
}

export function requiredLifecycleText(value: string, label: string, maxLength = 500) {
  const normalized = value.trim();
  if (!normalized) throw new ContractLifecycleError(`Informe ${label}.`);
  if (normalized.length > maxLength) throw new ContractLifecycleError(`${label} deve ter no máximo ${maxLength} caracteres.`);
  return normalized;
}

export function optionalLifecycleText(value: string, label: string, maxLength = 2_000) {
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new ContractLifecycleError(`${label} deve ter no máximo ${maxLength} caracteres.`);
  return normalized || null;
}

export function parseOptionalLifecycleDate(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) return null;
  const date = parseContractDate(normalized);
  if (!date) throw new ContractLifecycleError(`${label} inválida.`);
  return date;
}

export function assertLifecycleDateRange(startDate: Date | null, endDate: Date | null, startLabel = "data inicial", endLabel = "A data final") {
  if (startDate && endDate && utcCalendarDay(endDate) < utcCalendarDay(startDate)) {
    throw new ContractLifecycleError(`${endLabel} não pode ser anterior à ${startLabel.toLocaleLowerCase("pt-BR")}.`);
  }
}

export function assertDateWithinInstrumentValidity(date: Date, startDate: Date, endDate: Date, label: string) {
  const value = utcCalendarDay(date);
  const start = utcCalendarDay(startDate);
  const end = utcCalendarDay(endDate);
  if (value < start || value > end) {
    throw new ContractLifecycleError(`${label} deve estar dentro da vigência do instrumento.`);
  }
}

export function assertInstrumentAggregateTotalWithinCurrentValue(
  currentValue: string | number | { toString(): string },
  aggregateTotal: string | number | { toString(): string },
  label: string,
) {
  const cents = (value: string | number | { toString(): string }) => {
    const normalized = typeof value === "number" ? value.toFixed(2) : value.toString();
    const match = normalized.match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (!match) throw new ContractLifecycleError("Não foi possível validar o valor atual do instrumento.");
    return BigInt(match[1]) * BigInt(100) + BigInt((match[2] ?? "").padEnd(2, "0"));
  };
  if (cents(aggregateTotal) > cents(currentValue)) {
    throw new ContractLifecycleError(`O total de ${label} não pode exceder o valor atual do instrumento.`);
  }
}

export function assertPositiveSequence(value: number | null, label: string): number {
  if (!Number.isSafeInteger(value) || value! <= 0) throw new ContractLifecycleError(`${label} deve ser um número inteiro maior que zero.`);
  return value!;
}

export function assertOptionalQuantityAndUnit(quantity: number | null, unit: string, label: string) {
  const normalizedUnit = unit.trim();
  if (quantity === null && !normalizedUnit) return { quantity: null, unit: null };
  if (quantity === null || !normalizedUnit) throw new ContractLifecycleError(`${label} exige quantidade e unidade de medida.`);
  if (!Number.isFinite(quantity) || quantity < 0) throw new ContractLifecycleError(`Informe uma quantidade válida para ${label.toLocaleLowerCase("pt-BR")}.`);
  if (normalizedUnit.length > 40) throw new ContractLifecycleError("A unidade de medida deve ter no máximo 40 caracteres.");
  return { quantity, unit: normalizedUnit };
}

export function assertEditableMeasurementStatus(status: string) {
  if (["Atestada", "Cancelada"].includes(status)) {
    throw new ContractLifecycleError(`A medição ${status.toLocaleLowerCase("pt-BR")} não aceita alteração de itens.`);
  }
}

export function assertMeasurementStatusTransition(currentStatus: string, requestedStatus: string) {
  if (!isInstrumentMeasurementStatus(requestedStatus)) throw new ContractLifecycleError("Situação da medição inválida.");
  if (currentStatus === "Atestada" && ![currentStatus, "Cancelada"].includes(requestedStatus)) {
    throw new ContractLifecycleError("Uma medição atestada não pode ser reaberta.");
  }
  if (currentStatus === "Cancelada" && requestedStatus !== currentStatus) {
    throw new ContractLifecycleError("Uma medição cancelada não pode ser reaberta.");
  }
}

export function assertMeasurementCanBeAttested(input: {
  quantity: number | null;
  unit: string | null;
  value: number;
  itemCount: number;
  itemValueTotal: number;
}) {
  if (input.itemCount === 0 && (input.quantity === null || !input.unit)) {
    throw new ContractLifecycleError("Uma medição atestada exige quantidade e unidade ou ao menos um item de execução.");
  }
  if (input.itemCount > 0 && Math.abs(input.value - input.itemValueTotal) > 0.01) {
    throw new ContractLifecycleError("O valor da medição atestada deve corresponder à soma de seus itens.");
  }
}

export function parseInstrumentPartyReference(value: string): { kind: InstrumentPartyReferenceKind; id: string } {
  const [rawKind, rawId, ...rest] = value.trim().split(":");
  if (rest.length || !rawId || !instrumentPartyReferenceKinds.includes(rawKind as InstrumentPartyReferenceKind)) {
    throw new ContractLifecycleError("Selecione uma parte válida para o instrumento.");
  }
  return { kind: rawKind as InstrumentPartyReferenceKind, id: rawId! };
}
