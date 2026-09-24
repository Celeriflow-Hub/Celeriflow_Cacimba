import assert from "node:assert/strict";
import test from "node:test";
import { calculateTaxAssessment, TaxError } from "../index";

test("C8 calculates a tax assessment with statutory additions and discount", () => {
  const assessment = calculateTaxAssessment({ taxableBase: 1_000, rate: 2, interest: 5, penalty: 3, correction: 2, discount: 1 });

  assert.equal(assessment.principal.toString(), "20");
  assert.equal(assessment.finalValue.toString(), "29");
});

test("C8 rejects an assessment whose final value is not collectible", () => {
  assert.throws(
    () => calculateTaxAssessment({ taxableBase: 100, rate: 0 }),
    TaxError,
  );
});
