import assert from "node:assert/strict";
import test from "node:test";
import { apportionIss, calculateNfse, validateCorrectionChanges } from "../s4-engine";

test("nota A calcula base 8.000 e ISS próprio 240", () => { const result = calculateNfse({ serviceValue: 10_000, deductions: 2_000, ratePercent: 3, retained: false }); assert.equal(result.taxableBase.toFixed(2), "8000.00"); assert.equal(result.ownIss.toFixed(2), "240.00"); });
test("nota B completa ISS próprio de 300", () => { const a = calculateNfse({ serviceValue: 10_000, deductions: 2_000, ratePercent: 3, retained: false }); const b = calculateNfse({ serviceValue: 2_000, deductions: 0, ratePercent: 3, retained: false }); const total = apportionIss([a, b]); assert.equal(b.ownIss.toFixed(2), "60.00"); assert.equal(total.ownIss.toFixed(2), "300.00"); });
test("ISS retido 150 não é somado ao ISS próprio", () => { const result = calculateNfse({ serviceValue: 5_000, deductions: 0, ratePercent: 3, retained: true }); const total = apportionIss([result]); assert.equal(total.ownIss.toFixed(2), "0.00"); assert.equal(total.retainedIss.toFixed(2), "150.00"); });
test("carta aceita descrição e recusa base e identidade", () => { assert.deepEqual(validateCorrectionChanges({ serviceDescription: "Descrição corrigida" }), { serviceDescription: "Descrição corrigida" }); assert.throws(() => validateCorrectionChanges({ taxableBase: "9000" }), /não pode alterar/); assert.throws(() => validateCorrectionChanges({ providerId: "outro" }), /não pode alterar/); });
