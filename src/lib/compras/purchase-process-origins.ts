export type PurchaseRequestItemForProcessOrigin = {
  id: string;
  catalogItemId: string | null;
  materialId: string | null;
  customName: string | null;
  quantity: number;
  estimatedUnitValue: number | null;
};

export type AggregatedPurchaseProcessItem = {
  catalogItemId: string | null;
  materialId: string | null;
  customName: string | null;
  quantity: number;
  estimatedUnitValue: number;
  origins: Array<{ purchaseRequestItemId: string; quantity: number }>;
};

export class PurchaseProcessOriginError extends Error {}

function itemKey(item: PurchaseRequestItemForProcessOrigin) {
  return JSON.stringify([
    item.catalogItemId,
    item.materialId,
    item.customName,
    item.estimatedUnitValue ?? 0,
  ]);
}

export function aggregatePurchaseRequestItems(items: PurchaseRequestItemForProcessOrigin[]) {
  const groupedItems = new Map<string, AggregatedPurchaseProcessItem>();

  for (const item of items) {
    if (!item.id || !Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new PurchaseProcessOriginError("A solicitacao possui um item de origem invalido.");
    }
    const estimatedUnitValue = item.estimatedUnitValue ?? 0;
    if (!Number.isFinite(estimatedUnitValue) || estimatedUnitValue < 0) {
      throw new PurchaseProcessOriginError("A solicitacao possui um valor unitario invalido.");
    }

    const key = itemKey(item);
    const grouped = groupedItems.get(key);
    if (grouped) {
      grouped.quantity += item.quantity;
      grouped.origins.push({ purchaseRequestItemId: item.id, quantity: item.quantity });
      continue;
    }
    groupedItems.set(key, {
      catalogItemId: item.catalogItemId,
      materialId: item.materialId,
      customName: item.customName,
      quantity: item.quantity,
      estimatedUnitValue,
      origins: [{ purchaseRequestItemId: item.id, quantity: item.quantity }],
    });
  }

  return [...groupedItems.values()];
}
