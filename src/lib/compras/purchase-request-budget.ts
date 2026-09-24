import { Prisma } from "@prisma/client";

export type PurchaseRequestItemBudgetAllocationInput = {
  budgetAppropriationId: string;
  quantity: number;
  value: number;
};

export type NormalizedPurchaseRequestItemBudgetAllocation = {
  budgetAppropriationId: string;
  quantity: number;
  valueDecimal: Prisma.Decimal;
};

type PurchaseItemValue = {
  quantity: number;
  estimatedUnitValue: number | null;
};

type StoredPurchaseRequestItemBudgetAllocation = {
  budgetAppropriationId: string;
  quantity: number;
  valueDecimal: Prisma.Decimal;
};

export class PurchaseRequestBudgetError extends Error {}

function decimal(value: number, label: string, allowZero: boolean) {
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) {
    throw new PurchaseRequestBudgetError(`${label} invalido.`);
  }
  return new Prisma.Decimal(String(value));
}

function expectedValue(item: PurchaseItemValue) {
  const quantity = decimal(item.quantity, "Quantidade do item", false);
  const unitValue = decimal(item.estimatedUnitValue ?? 0, "Valor unitario do item", true);
  return quantity.mul(unitValue).toDecimalPlaces(2);
}

function assertAllocationTotals(item: PurchaseItemValue, allocations: StoredPurchaseRequestItemBudgetAllocation[]) {
  if (!allocations.length) {
    throw new PurchaseRequestBudgetError("Cada item deve possuir ao menos uma alocacao orcamentaria.");
  }

  const totalQuantity = allocations.reduce(
    (total, allocation) => total.plus(decimal(allocation.quantity, "Quantidade alocada", false)),
    new Prisma.Decimal(0),
  );
  if (!totalQuantity.equals(decimal(item.quantity, "Quantidade do item", false))) {
    throw new PurchaseRequestBudgetError("A quantidade alocada deve corresponder exatamente a quantidade do item.");
  }

  const totalValue = allocations.reduce((total, allocation) => total.plus(allocation.valueDecimal), new Prisma.Decimal(0));
  if (!totalValue.equals(expectedValue(item))) {
    throw new PurchaseRequestBudgetError("O valor alocado deve corresponder exatamente ao valor estimado do item.");
  }
}

export function normalizePurchaseRequestItemBudgetAllocations(rawAllocations: unknown, item: PurchaseItemValue) {
  if (!Array.isArray(rawAllocations)) {
    throw new PurchaseRequestBudgetError("Informe as alocacoes orcamentarias do item.");
  }

  const appropriationIds = new Set<string>();
  const allocations = rawAllocations.map((rawAllocation, index): NormalizedPurchaseRequestItemBudgetAllocation => {
    if (!rawAllocation || typeof rawAllocation !== "object" || Array.isArray(rawAllocation)) {
      throw new PurchaseRequestBudgetError(`Alocacao ${index + 1} invalida.`);
    }
    const allocation = rawAllocation as Record<string, unknown>;
    const budgetAppropriationId = typeof allocation.budgetAppropriationId === "string" ? allocation.budgetAppropriationId.trim() : "";
    if (!budgetAppropriationId || appropriationIds.has(budgetAppropriationId)) {
      throw new PurchaseRequestBudgetError("Selecione dotacoes orcamentarias distintas para cada item.");
    }
    appropriationIds.add(budgetAppropriationId);

    const quantity = allocation.quantity;
    const value = allocation.value;
    if (typeof quantity !== "number" || typeof value !== "number") {
      throw new PurchaseRequestBudgetError(`Alocacao ${index + 1} invalida.`);
    }
    const valueDecimal = decimal(value, "Valor alocado", true);
    if ((valueDecimal.decimalPlaces() ?? 0) > 2) {
      throw new PurchaseRequestBudgetError("O valor alocado deve possuir no maximo duas casas decimais.");
    }

    return { budgetAppropriationId, quantity: decimal(quantity, "Quantidade alocada", false).toNumber(), valueDecimal };
  });

  assertAllocationTotals(item, allocations);
  return allocations;
}

export function assertPurchaseRequestItemBudgetAllocations(item: PurchaseItemValue, allocations: StoredPurchaseRequestItemBudgetAllocation[]) {
  const appropriationIds = new Set<string>();
  for (const allocation of allocations) {
    if (!allocation.budgetAppropriationId || appropriationIds.has(allocation.budgetAppropriationId)) {
      throw new PurchaseRequestBudgetError("As alocacoes orcamentarias do item sao invalidas.");
    }
    appropriationIds.add(allocation.budgetAppropriationId);
    if (allocation.valueDecimal.isNegative()) {
      throw new PurchaseRequestBudgetError("O valor alocado nao pode ser negativo.");
    }
  }
  assertAllocationTotals(item, allocations);
}

export function totalPurchaseRequestBudgetAllocations(allocationsByItem: NormalizedPurchaseRequestItemBudgetAllocation[][]) {
  return allocationsByItem.reduce(
    (total, allocations) => allocations.reduce((itemTotal, allocation) => itemTotal.plus(allocation.valueDecimal), total),
    new Prisma.Decimal(0),
  );
}
