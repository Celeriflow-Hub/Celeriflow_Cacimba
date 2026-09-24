import assert from "node:assert/strict";
import test from "node:test";
import { calculateItbi, canDeleteDteMessage, dteDeadline, nextPowerOfAttorneyStatus, resolveDteAcknowledgement } from "../s3-engine";

test("ITBI integral usa uma única vez a base de 300 mil", () => {
  const result = calculateItbi({ propertyValue: 300_000, transmittedFractionPercent: 100, ratePercent: 2, buyerSharesPercent: [60, 40] });
  assert.equal(result.taxableBase.toFixed(2), "300000.00");
  assert.equal(result.taxAmount.toFixed(2), "6000.00");
  assert.equal(result.allocations[0].taxAmount.toFixed(2), "3600.00");
  assert.equal(result.allocations[1].taxAmount.toFixed(2), "2400.00");
});

test("ITBI parcial calcula 50% antes de repartir 60/40", () => {
  const result = calculateItbi({ propertyValue: 300_000, transmittedFractionPercent: 50, ratePercent: 2, buyerSharesPercent: [60, 40] });
  assert.equal(result.taxableBase.toFixed(2), "150000.00");
  assert.equal(result.taxAmount.toFixed(2), "3000.00");
  assert.equal(result.allocations[0].transmittedValue.toFixed(2), "90000.00");
  assert.equal(result.allocations[1].transmittedValue.toFixed(2), "60000.00");
});

test("ITBI rejeita participações que não totalizam cem por cento", () => {
  assert.throws(() => calculateItbi({ propertyValue: 300_000, transmittedFractionPercent: 100, ratePercent: 2, buyerSharesPercent: [60, 60] }), /100%/);
});

test("aviso externo não cria leitura nem ciência no DTE", () => {
  const availableAt = new Date("2026-09-20T12:00:00.000Z");
  const deadlineAt = dteDeadline(availableAt, 5);
  const before = resolveDteAcknowledgement({ availableAt, deadlineAt, now: new Date("2026-09-22T12:00:00.000Z") });
  assert.equal(before.state, "PENDENTE");
  const after = resolveDteAcknowledgement({ availableAt, deadlineAt, now: new Date("2026-09-26T12:00:00.000Z") });
  assert.equal(after.state, "CIENCIA_TACITA");
});

test("retenção e assinatura impedem exclusão e procuração respeita transições", () => {
  assert.equal(canDeleteDteMessage({ retentionRequired: false, acknowledged: false, signatureRequired: false }), true);
  assert.equal(canDeleteDteMessage({ retentionRequired: true, acknowledged: false, signatureRequired: false }), false);
  assert.equal(nextPowerOfAttorneyStatus("PENDENTE_ACEITE", "ACEITAR"), "ATIVA");
  assert.equal(nextPowerOfAttorneyStatus("ATIVA", "REVOGAR"), "REVOGADA");
  assert.throws(() => nextPowerOfAttorneyStatus("RECUSADA", "ACEITAR"));
});
