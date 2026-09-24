import assert from "node:assert/strict";
import { test } from "node:test";
import { AssetLifecycleError, calculateAssetDisposal, calculateAssetValueAdjustment, calculateStraightLineDepreciation, normalizeReferenceMonth, recordAssetDisposal } from "../asset-lifecycle";

test("calculates straight-line depreciation and absorbs rounding in the final competence", () => {
  assert.equal(calculateStraightLineDepreciation({ acquisitionValue: 100, bookValue: 100, lifeSpanMonths: 3, periodNumber: 1 }), 33.33);
  assert.equal(calculateStraightLineDepreciation({ acquisitionValue: 100, bookValue: 33.34, lifeSpanMonths: 3, periodNumber: 3 }), 33.34);
});

test("never depreciates an asset before acquisition or after its useful life", () => {
  const input = { acquisitionValue: 120, bookValue: 120, lifeSpanMonths: 12 };
  assert.equal(calculateStraightLineDepreciation({ ...input, periodNumber: 0 }), 0);
  assert.equal(calculateStraightLineDepreciation({ ...input, periodNumber: 13 }), 0);
});

test("normalizes a competence to the first day of its UTC month", () => {
  assert.deepEqual(normalizeReferenceMonth(new Date("2026-08-27T00:00:00.000Z")), new Date("2026-08-01T12:00:00.000Z"));
  assert.throws(() => normalizeReferenceMonth(new Date("invalid")), AssetLifecycleError);
});

test("retains the book value and calculates the disposal gain or loss", () => {
  assert.deepEqual(calculateAssetDisposal(75.5, 100), { bookValue: 75.5, disposalValue: 100, gainLoss: 24.5 });
  assert.deepEqual(calculateAssetDisposal(75.5, 0), { bookValue: 75.5, disposalValue: 0, gainLoss: -75.5 });
});

test("calculates revaluation, impairment and subsequent cost without changing prior history", () => {
  assert.deepEqual(calculateAssetValueAdjustment(100, "REVALUATION", 125), { openingValue: 100, adjustmentValue: 25, closingValue: 125 });
  assert.deepEqual(calculateAssetValueAdjustment(100, "IMPAIRMENT", 75), { openingValue: 100, adjustmentValue: -25, closingValue: 75 });
  assert.deepEqual(calculateAssetValueAdjustment(100, "SUBSEQUENT_COST", 25), { openingValue: 100, adjustmentValue: 25, closingValue: 125 });
});

test("rejects unsafe asset value adjustments", () => {
  assert.throws(() => calculateAssetValueAdjustment(100, "IMPAIRMENT", 100), AssetLifecycleError);
  assert.throws(() => calculateAssetValueAdjustment(100, "SUBSEQUENT_COST", 0), AssetLifecycleError);
  assert.throws(() => calculateAssetValueAdjustment(100, "REVALUATION", 100), AssetLifecycleError);
});

test("records a configuration pending item instead of faking disposal accounting", async () => {
  const pending: Array<Record<string, unknown>> = [];
  let status = "Ativo";
  const transaction = {
    asset: {
      findUnique: async () => ({ id: "asset-1", status, currentValue: 75, maintenances: [] }),
      update: async ({ data }: { data: { status: string } }) => { status = data.status; },
    },
    assetWriteOff: {
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => ({ id: "write-off-1", date: data.date, gainLoss: data.gainLoss }),
    },
    assetIntegrationPendingConfiguration: {
      create: async ({ data }: { data: Record<string, unknown> }) => { pending.push(data); return data; },
    },
  };
  const database = { $transaction: async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction) };

  const result = await recordAssetDisposal(database as never, {
    assetId: "asset-1", date: new Date("2026-08-01T12:00:00.000Z"), type: "Alienação", reason: "Leilão", justification: "Processo 1", disposalValue: 100,
  });

  assert.equal(result.integration.pending, true);
  assert.equal(status, "Baixado");
  assert.deepEqual(pending[0], {
    assetWriteOffId: "write-off-1",
    expectedEventCode: "ASSET_DISPOSAL_GAIN",
    reason: "A baixa não possui servidor responsável apto a postar o evento contábil.",
  });
});
