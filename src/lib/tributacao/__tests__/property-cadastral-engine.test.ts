import assert from "node:assert/strict";
import test from "node:test";
import { calculateTerritorialFraction, previewPropertyValuation } from "../property-cadastral-engine";

test("calcula fração territorial sem ultrapassar cem por cento", () => {
  assert.equal(calculateTerritorialFraction({ unitLandArea: 30, totalLandArea: 120 }).toString(), "25");
  assert.throws(() => calculateTerritorialFraction({ unitLandArea: 130, totalLandArea: 120 }));
});

test("gera prévia do valor venal e usa o cálculo tributário existente", () => {
  const preview = previewPropertyValuation({ landArea: 100, builtArea: 120, landUnitValue: 500, constructionUnitValue: 500, factor: 1, taxRate: 1 });
  assert.equal(preview.landValue.toString(), "50000");
  assert.equal(preview.constructionValue.toString(), "60000");
  assert.equal(preview.venalValue.toString(), "110000");
  assert.equal(preview.estimatedTax?.toString(), "1100");
  assert.equal(preview.memory.effect, "PREVIEW_ONLY");
});
