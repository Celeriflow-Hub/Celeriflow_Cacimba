import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultReportTemplate, createReportTemplateFingerprint, createReportTemplatePresentation } from "../src/lib/reports/report-template.ts";

test("fingerprints the complete versioned template deterministically", () => {
  const values = { version: 2, header: "Uso interno", footer: "CeleriFlow", orientation: "PORTRAIT" as const, includeEmissionMetadata: false };
  assert.equal(createReportTemplateFingerprint(values), createReportTemplateFingerprint(values));
  assert.notEqual(createReportTemplateFingerprint(values), createReportTemplateFingerprint({ ...values, version: 3 }));
});

test("uses a safe global template until an administrator configures one", () => {
  const fallback = createDefaultReportTemplate();
  assert.deepEqual(createReportTemplatePresentation(null), fallback);
  assert.equal(fallback.orientation, "LANDSCAPE");
  assert.equal(fallback.version, 1);
});
