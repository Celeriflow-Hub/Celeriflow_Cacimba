import assert from "node:assert/strict";
import test from "node:test";
import { healthAdministrativeReportOptions, isHealthAdministrativeReportType } from "../src/lib/saude/health-report-catalog.ts";
import { calculateMunicipalityPercentages } from "../src/lib/saude/health-report-policy.ts";

test("catálogo F1-E contém exatamente SAU-ADM-051 a SAU-ADM-064", () => {
  const f1eOptions = healthAdministrativeReportOptions.filter(option => option.requirement.startsWith("SAU-ADM-"));
  assert.equal(f1eOptions.length, 14);
  assert.deepEqual(f1eOptions.map(option => option.requirement), Array.from({ length: 14 }, (_, index) => `SAU-ADM-${String(index + 51).padStart(3, "0")}`));
  assert.equal(new Set(f1eOptions.map(option => option.type)).size, 14);
  for (const option of f1eOptions) {
    assert.equal(isHealthAdministrativeReportType(option.type), true);
    assert.ok(option.filters.length > 0);
  }
});

test("percentuais municipais usam o total completo do recorte", () => {
  const result = calculateMunicipalityPercentages([
    { city: "Divino de São Lourenço", state: "ES", count: 6 },
    { city: "Guaçuí", state: "ES", count: 3 },
    { city: "Guaçuí", state: "ES", count: 1 },
  ]);
  assert.deepEqual(result, [
    { label: "Divino de São Lourenço, ES", value: 6, percentage: 60 },
    { label: "Guaçuí, ES", value: 4, percentage: 40 },
  ]);
  assert.equal(result.reduce((sum, row) => sum + row.value, 0), 10);
  assert.equal(result.reduce((sum, row) => sum + row.percentage, 0), 100);
});

test("recorte vazio não produz divisão por zero", () => {
  assert.deepEqual(calculateMunicipalityPercentages([]), []);
});
