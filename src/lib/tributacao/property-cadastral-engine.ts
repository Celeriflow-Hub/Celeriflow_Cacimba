import { Prisma } from "@prisma/client";
import { calculateTaxAssessment } from "@/lib/tributacao";

function nonNegative(value: number | string, label: string) {
  const decimal = new Prisma.Decimal(String(value));
  if (!decimal.isFinite() || decimal.lessThan(0)) throw new Error(`${label} deve ser um valor não negativo.`);
  return decimal;
}

export function calculateTerritorialFraction(input: { unitLandArea: number | string; totalLandArea: number | string }) {
  const unitLandArea = nonNegative(input.unitLandArea, "Área da unidade");
  const totalLandArea = nonNegative(input.totalLandArea, "Área total do terreno");
  if (totalLandArea.lessThanOrEqualTo(0)) throw new Error("A área total do terreno deve ser maior que zero.");
  if (unitLandArea.greaterThan(totalLandArea)) throw new Error("A área da unidade não pode superar a área total do terreno.");
  return unitLandArea.div(totalLandArea).mul(100).toDecimalPlaces(6);
}

export function previewPropertyValuation(input: {
  landArea: number | string;
  builtArea: number | string;
  landUnitValue: number | string;
  constructionUnitValue: number | string;
  factor?: number | string;
  taxRate?: number | string;
}) {
  const landArea = nonNegative(input.landArea, "Área do terreno");
  const builtArea = nonNegative(input.builtArea, "Área construída");
  const landUnitValue = nonNegative(input.landUnitValue, "Valor unitário do terreno");
  const constructionUnitValue = nonNegative(input.constructionUnitValue, "Valor unitário da construção");
  const factor = nonNegative(input.factor ?? 1, "Fator cadastral");
  if (factor.lessThanOrEqualTo(0)) throw new Error("O fator cadastral deve ser maior que zero.");
  const landValue = landArea.mul(landUnitValue).toDecimalPlaces(2);
  const constructionValue = builtArea.mul(constructionUnitValue).toDecimalPlaces(2);
  const venalValue = landValue.plus(constructionValue).mul(factor).toDecimalPlaces(2);
  const taxRate = nonNegative(input.taxRate ?? 0, "Alíquota");
  const assessment = taxRate.greaterThan(0) ? calculateTaxAssessment({ taxableBase: venalValue, rate: taxRate }) : null;
  return {
    landValue,
    constructionValue,
    venalValue,
    taxRate,
    estimatedTax: assessment?.principal ?? null,
    memory: {
      formula: "((landArea × landUnitValue) + (builtArea × constructionUnitValue)) × factor",
      landArea: landArea.toFixed(4),
      builtArea: builtArea.toFixed(4),
      landUnitValue: landUnitValue.toFixed(6),
      constructionUnitValue: constructionUnitValue.toFixed(6),
      factor: factor.toFixed(6),
      venalValue: venalValue.toFixed(2),
      taxRate: taxRate.toString(),
      estimatedTax: assessment?.principal.toFixed(2) ?? null,
      effect: "PREVIEW_ONLY",
    },
  };
}
