import assert from "node:assert/strict";
import test from "node:test";
import { collectionRate, concessionSituation, executionNext, formatCdaNumber, graveHasVacancy, internalProtocol, nextCdaVersion, occupancyStats, protestNext, sumBy, trendByMonth, validateEnrollmentEligibility } from "../s9-engine";

test("bloqueia inscrição duplicada, suspensa ou sem endereço (TRI-340/341)", () => {
  const base = { taxpayerActive: true, hasIdentification: true, hasAddress: true, debtStatus: "Lançado", debtValue: 600, alreadyEnrolled: false, suspended: false };
  assert.equal(validateEnrollmentEligibility(base).eligible, true);
  assert.equal(validateEnrollmentEligibility({ ...base, alreadyEnrolled: true }).eligible, false);
  assert.equal(validateEnrollmentEligibility({ ...base, suspended: true }).eligible, false);
  const missing = validateEnrollmentEligibility({ ...base, hasAddress: false });
  assert.equal(missing.eligible, false);
  assert.ok(missing.reasons.some((reason) => reason.includes("Endereço")));
});

test("numera CDA e incrementa versão sem reutilizar número (TRI-347/348)", () => {
  assert.equal(formatCdaNumber(2026, 42), "CDA-2026-0000042");
  assert.equal(nextCdaVersion(0), 1);
  assert.equal(nextCdaVersion(2), 3);
});

test("protesto só avança por transições internas, sem estado de efetivação (TRI-373..380)", () => {
  assert.equal(protestNext("SELECIONADA", "PREPARAR_REMESSA"), "REMESSA_PREPARADA");
  assert.equal(protestNext("EM_ACOMPANHAMENTO", "ANUIR"), "ANUIDA");
  assert.throws(() => protestNext("SELECIONADA", "ANUIR"));
});

test("execução usa protocolo interno e transições controladas (TRI-388..398)", () => {
  assert.equal(internalProtocol("EXEC", 2026, 7), "INT-EXEC-2026-000007");
  assert.equal(executionNext("EM_PREPARO", "ENVIAR_PROCURADORIA"), "NA_PROCURADORIA");
  assert.equal(executionNext("PROTOCOLADO_INTERNO", "REGISTRAR_MNI"), "MNI_REGISTRO_INTERNO");
  assert.throws(() => executionNext("EM_PREPARO", "REGISTRAR_MNI"));
});

test("ocupação de sepulturas respeita capacidade e interdição (TRI-415/432)", () => {
  assert.equal(graveHasVacancy({ status: "LIVRE", capacity: 1, occupantCount: 0 }), true);
  assert.equal(graveHasVacancy({ status: "LIVRE", capacity: 1, occupantCount: 1 }), false);
  assert.equal(graveHasVacancy({ status: "INTERDITADA", capacity: 4, occupantCount: 0 }), false);
  assert.deepEqual(occupancyStats([{ capacity: 1, occupantCount: 1 }, { capacity: 2, occupantCount: 1 }]), { graves: 2, capacity: 3, occupied: 2, free: 1, rate: 66.67 });
});

test("concessão temporária vence pelo prazo; indeterminada segue vigente (TRI-428)", () => {
  assert.equal(concessionSituation({ concessionType: "TEMPORARIA", status: "VIGENTE", endsAt: new Date("2020-01-01T00:00:00.000Z") }, new Date("2026-01-01T00:00:00.000Z")), "VENCIDA");
  assert.equal(concessionSituation({ concessionType: "INDETERMINADA", status: "VIGENTE", endsAt: null }), "VIGENTE");
  assert.equal(concessionSituation({ concessionType: "TEMPORARIA", status: "CANCELADA", endsAt: null }), "CANCELADA");
});

test("BI agrega linhas reais por grupo e mês, com taxa previsto x realizado (TRI-437..444)", () => {
  const grouped = sumBy([{ tax: "IPTU", v: 100 }, { tax: "IPTU", v: 50 }, { tax: "ISS", v: 200 }], (row) => row.tax, (row) => row.v);
  assert.deepEqual(grouped.map((row) => [row.label, row.count, row.total]), [["ISS", 1, 200], ["IPTU", 2, 150]]);
  const trend = trendByMonth([{ date: new Date("2026-02-01T00:00:00.000Z"), value: 10 }, { date: new Date("2026-01-01T00:00:00.000Z"), value: 5 }]);
  assert.deepEqual(trend.map((row) => row.label), ["2026-01", "2026-02"]);
  const rate = collectionRate(1000, 600);
  assert.equal(rate.rate, 60);
  assert.equal(String(rate.predicted), "1000");
  assert.equal(String(rate.realized), "600");
});
