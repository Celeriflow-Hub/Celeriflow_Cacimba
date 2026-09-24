import assert from "node:assert/strict";
import test from "node:test";
import {
  ContractLifecycleError,
  assertDateWithinInstrumentValidity,
  assertInstrumentAggregateTotalWithinCurrentValue,
  assertLifecycleDateRange,
  assertMeasurementCanBeAttested,
  assertMeasurementStatusTransition,
  assertOptionalQuantityAndUnit,
  calculateInclusiveContractTermDays,
  contractBudgetUnitIdsForMutation,
  parseContractDate,
  parseInstrumentPartyReference,
  resolveContractAmendmentEffect,
} from "../src/lib/compras/contract-lifecycle.ts";

const operator = {
  profileCode: "COMPRAS_OPERADOR",
  allowedBudgetUnitIds: ["ug-a", "ug-b"],
};

test("CLC-049/072 authorizes both the current and requested contract UGs", () => {
  assert.deepEqual(
    contractBudgetUnitIdsForMutation(operator, { currentSourceBudgetUnitId: "ug-a", requestedSourceBudgetUnitId: "ug-b" }),
    ["ug-a", "ug-b"],
  );
  assert.throws(
    () => contractBudgetUnitIdsForMutation({ ...operator, allowedBudgetUnitIds: ["ug-b"] }, { currentSourceBudgetUnitId: "ug-a", requestedSourceBudgetUnitId: "ug-b" }),
    ContractLifecycleError,
  );
  assert.throws(
    () => contractBudgetUnitIdsForMutation({ ...operator, allowedBudgetUnitIds: ["ug-b"] }, { currentSourceBudgetUnitId: "ug-a" }),
    ContractLifecycleError,
  );
});

test("CLC-049/072 denies legacy contracts without a UG to non-administrators", () => {
  assert.throws(
    () => contractBudgetUnitIdsForMutation(operator, { currentSourceBudgetUnitId: null, requestedSourceBudgetUnitId: "ug-a" }),
    /legados sem Unidade Gestora/i,
  );
  assert.deepEqual(
    contractBudgetUnitIdsForMutation(
      { profileCode: "SYSTEM_ADMINISTRATOR", allowedBudgetUnitIds: [] },
      { currentSourceBudgetUnitId: null, requestedSourceBudgetUnitId: "ug-external" },
    ),
    ["ug-external"],
  );
});

test("CLC-049/072 calculates inclusive contractual term days from calendar dates", () => {
  const start = parseContractDate("2026-08-01");
  const end = parseContractDate("2026-08-30");
  assert.ok(start);
  assert.ok(end);
  assert.equal(calculateInclusiveContractTermDays(start, end), 30);
  assert.equal(parseContractDate("2026-02-30"), null);
});

test("CLC-050/073 preserves the prior amount and applies only the requested contractual effect", () => {
  const baseline = {
    updatedValue: 2260,
    startDate: new Date("2026-08-01T12:00:00.000Z"),
    endDate: new Date("2026-09-30T12:00:00.000Z"),
  };
  const amendment = resolveContractAmendmentEffect(baseline, {
    type: "Ambos",
    newValue: 2486,
    newEndDate: new Date("2026-10-31T12:00:00.000Z"),
  });
  assert.equal(amendment.previousValue, 2260);
  assert.equal(amendment.newValue, 2486);
  assert.equal(amendment.previousEndDate?.toISOString(), baseline.endDate.toISOString());
  assert.equal(amendment.newEndDate?.toISOString(), "2026-10-31T12:00:00.000Z");
  assert.deepEqual(amendment.contractUpdate, { updatedValue: 2486, endDate: new Date("2026-10-31T12:00:00.000Z") });

  const suspension = resolveContractAmendmentEffect(baseline, { type: "Suspensão" });
  assert.deepEqual(suspension.contractUpdate, { status: "Suspenso" });
  assert.equal(suspension.newValue, null);
});

test("instrument execution validates paired physical quantities, periods, and identities", () => {
  assert.deepEqual(assertOptionalQuantityAndUnit(12, "UN", "A medição"), { quantity: 12, unit: "UN" });
  assert.throws(() => assertOptionalQuantityAndUnit(12, "", "A medição"), /quantidade e unidade/i);
  assert.throws(
    () => assertLifecycleDateRange(new Date("2026-09-02T12:00:00.000Z"), new Date("2026-09-01T12:00:00.000Z")),
    /não pode ser anterior/i,
  );
  assert.deepEqual(parseInstrumentPartyReference("EMPLOYEE:server-1"), { kind: "EMPLOYEE", id: "server-1" });
  assert.throws(() => parseInstrumentPartyReference("EMPLOYEE:server-1:extra"), ContractLifecycleError);
});

test("instrument execution keeps measurement dates and active amounts within the current instrument", () => {
  const start = new Date("2026-09-01T12:00:00.000Z");
  const end = new Date("2026-09-30T12:00:00.000Z");

  assert.doesNotThrow(() => assertDateWithinInstrumentValidity(start, start, end, "A data da medição"));
  assert.doesNotThrow(() => assertDateWithinInstrumentValidity(end, start, end, "A data da medição"));
  assert.throws(
    () => assertDateWithinInstrumentValidity(new Date("2026-10-01T12:00:00.000Z"), start, end, "A data da medição"),
    /dentro da vigência/i,
  );
  assert.doesNotThrow(() => assertInstrumentAggregateTotalWithinCurrentValue("1000.00", "1000.00", "medições ativas"));
  assert.throws(
    () => assertInstrumentAggregateTotalWithinCurrentValue("1000.00", "1000.01", "parcelas programadas"),
    /não pode exceder/i,
  );
  assert.doesNotThrow(() => assertInstrumentAggregateTotalWithinCurrentValue(0.1 + 0.2, "0.30", "medições ativas"));
  assert.throws(
    () => assertInstrumentAggregateTotalWithinCurrentValue("1000.00", "1000.001", "medições ativas"),
    /não foi possível validar/i,
  );
});

test("attestation keeps physical execution auditable and does not reopen finalized measurements", () => {
  assert.throws(
    () => assertMeasurementCanBeAttested({ quantity: null, unit: null, value: 100, itemCount: 0, itemValueTotal: 0 }),
    /exige quantidade/i,
  );
  assert.throws(
    () => assertMeasurementCanBeAttested({ quantity: 1, unit: "UN", value: 100, itemCount: 1, itemValueTotal: 99 }),
    /soma de seus itens/i,
  );
  assert.doesNotThrow(() => assertMeasurementCanBeAttested({ quantity: 1, unit: "UN", value: 100, itemCount: 1, itemValueTotal: 100 }));
  assert.throws(() => assertMeasurementStatusTransition("Atestada", "Rascunho"), /não pode ser reaberta/i);
  assert.doesNotThrow(() => assertMeasurementStatusTransition("Atestada", "Cancelada"));
  assert.throws(() => assertMeasurementStatusTransition("Cancelada", "Atestada"), /não pode ser reaberta/i);
  assert.doesNotThrow(() => assertMeasurementStatusTransition("Rascunho", "Atestada"));
});
