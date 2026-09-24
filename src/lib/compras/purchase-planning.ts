import { Prisma } from "@prisma/client";

export const purchasePlanningStatuses = ["Rascunho", "Planejado", "Cancelado"] as const;

export type PurchasePlanningStatus = (typeof purchasePlanningStatuses)[number];

export type PurchasePlanningInput = {
  description?: string | null;
  catalogItemId?: string | null;
  originPurchaseRequestId?: string | null;
  unit?: string | null;
  quantity?: string | number | null;
  expectedPeriodStart?: string | null;
  expectedPeriodEnd?: string | null;
  estimatedValueDecimal?: string | number | null;
  status?: string | null;
};

export class PurchasePlanningError extends Error {}

function optionalId(value: string | null | undefined) {
  return value?.trim() || null;
}

function planningDate(value: string | null | undefined, label: string) {
  const normalized = value?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new PurchasePlanningError(`Informe ${label.toLocaleLowerCase("pt-BR")} válido.`);
  }
  const date = new Date(`${normalized}T12:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== normalized) {
    throw new PurchasePlanningError(`Informe ${label.toLocaleLowerCase("pt-BR")} válido.`);
  }
  return date;
}

function numericValue(value: string | number | null | undefined, label: string, options: { positive?: boolean; decimalPlaces: number }) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  const decimalPattern = new RegExp(`^\\d{1,16}(?:\\.\\d{1,${options.decimalPlaces}})?$`);
  if (!decimalPattern.test(normalized)) {
    throw new PurchasePlanningError(`Informe ${label.toLocaleLowerCase("pt-BR")} válido.`);
  }
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0 || (options.positive && number === 0)) {
    throw new PurchasePlanningError(`Informe ${label.toLocaleLowerCase("pt-BR")} ${options.positive ? "maior que zero" : "maior ou igual a zero"}.`);
  }
  return { number, decimal: new Prisma.Decimal(normalized) };
}

function utcCalendarDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function isPurchasePlanningStatus(value: string): value is PurchasePlanningStatus {
  return purchasePlanningStatuses.includes(value as PurchasePlanningStatus);
}

export function normalizePurchasePlanningInput(input: PurchasePlanningInput, now = new Date()) {
  const description = input.description?.trim() || null;
  const catalogItemId = optionalId(input.catalogItemId);
  const originPurchaseRequestId = optionalId(input.originPurchaseRequestId);
  const unit = input.unit?.trim() ?? "";
  const status = input.status?.trim() || "Rascunho";

  if (!catalogItemId && !description) {
    throw new PurchasePlanningError("Selecione um item do catálogo ou informe a especificação da necessidade.");
  }
  if (description && description.length > 2_000) {
    throw new PurchasePlanningError("A especificação da necessidade deve ter no máximo 2000 caracteres.");
  }
  if (!unit || unit.length > 40) {
    throw new PurchasePlanningError("Informe uma unidade de medida com até 40 caracteres.");
  }
  if (!isPurchasePlanningStatus(status)) {
    throw new PurchasePlanningError("Situação do planejamento inválida.");
  }

  const quantity = numericValue(input.quantity, "a quantidade", { positive: true, decimalPlaces: 3 }).number;
  const estimatedValueDecimal = numericValue(input.estimatedValueDecimal, "o valor estimado", { decimalPlaces: 2 }).decimal;
  const expectedPeriodStart = planningDate(input.expectedPeriodStart, "a data inicial do período esperado");
  const expectedPeriodEnd = planningDate(input.expectedPeriodEnd, "a data final do período esperado");
  const today = utcCalendarDay(now);

  if (utcCalendarDay(expectedPeriodStart) < today) {
    throw new PurchasePlanningError("O período esperado deve iniciar hoje ou em uma data futura.");
  }
  if (utcCalendarDay(expectedPeriodEnd) < utcCalendarDay(expectedPeriodStart)) {
    throw new PurchasePlanningError("A data final do período esperado não pode ser anterior à data inicial.");
  }

  return {
    description,
    catalogItemId,
    originPurchaseRequestId,
    unit,
    quantity,
    expectedPeriodStart,
    expectedPeriodEnd,
    estimatedValueDecimal,
    status,
  };
}
