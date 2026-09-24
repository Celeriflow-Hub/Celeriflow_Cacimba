export type NormalizedPurchaseItemInput = {
  id?: string;
  catalogItemId: string | null;
  customName: string | null;
  quantity: number;
  estimatedUnitValue: number;
};

export class PurchaseItemInputError extends Error {}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

export function normalizePurchaseItems(rawItems: unknown) {
  if (!Array.isArray(rawItems) || !rawItems.length) {
    throw new PurchaseItemInputError("Adicione ao menos um item.");
  }

  let estimatedValue = 0;
  const items = rawItems.map((rawItem, index): NormalizedPurchaseItemInput => {
    if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
      throw new PurchaseItemInputError(`Item ${index + 1} invalido.`);
    }

    const item = rawItem as Record<string, unknown>;
    const rawId = item.id;
    const id = rawId === undefined || rawId === null || rawId === "" ? undefined : text(rawId);
    if (rawId !== undefined && rawId !== null && rawId !== "" && !id) {
      throw new PurchaseItemInputError(`Identificador do item ${index + 1} invalido.`);
    }

    const selectedCatalogItemId = text(item.catalogItemId);
    if (!selectedCatalogItemId) {
      throw new PurchaseItemInputError("Selecione um item do catalogo ou descreva um item livre.");
    }

    const isCustomItem = selectedCatalogItemId === "custom";
    const customName = isCustomItem ? text(item.customName) : null;
    if (isCustomItem && !customName) {
      throw new PurchaseItemInputError("Descreva o item livre.");
    }

    const quantity = item.quantity;
    const estimatedUnitValue = item.estimatedUnitValue;
    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
      throw new PurchaseItemInputError("Revise os itens e suas quantidades.");
    }
    if (typeof estimatedUnitValue !== "number" || !Number.isFinite(estimatedUnitValue) || estimatedUnitValue < 0) {
      throw new PurchaseItemInputError("Revise os valores unitarios dos itens.");
    }

    estimatedValue += quantity * estimatedUnitValue;
    if (!Number.isFinite(estimatedValue)) {
      throw new PurchaseItemInputError("O valor estimado dos itens e invalido.");
    }

    return {
      ...(id ? { id } : {}),
      catalogItemId: isCustomItem ? null : selectedCatalogItemId,
      customName,
      quantity,
      estimatedUnitValue,
    };
  });

  return { items, estimatedValue };
}
