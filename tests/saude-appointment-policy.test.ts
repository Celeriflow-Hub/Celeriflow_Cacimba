import assert from "node:assert/strict";
import test from "node:test";
import {
  HealthAppointmentPolicyError,
  assertHealthAppointmentCanBeCompletedAt,
  assertHealthAppointmentCanBeCompleted,
  assertHealthAppointmentTransition,
  parseBrazilDateTime,
} from "../src/lib/saude/appointment-policy.ts";
import {
  healthAppointmentCompletionSchema,
  healthAppointmentTransitionSchema,
  patientInputSchema,
} from "../src/lib/saude/contract.ts";

test("permite somente as transicoes operacionais da agenda", () => {
  assert.doesNotThrow(() => assertHealthAppointmentTransition("Agendado", "Aguardando"));
  assert.doesNotThrow(() => assertHealthAppointmentTransition("Agendado", "Confirmado"));
  assert.doesNotThrow(() => assertHealthAppointmentTransition("Confirmado", "Aguardando"));
  assert.doesNotThrow(() => assertHealthAppointmentTransition("Aguardando", "Em Atendimento"));
  assert.throws(() => assertHealthAppointmentTransition("Cancelado", "Aguardando"), HealthAppointmentPolicyError);
  assert.throws(() => assertHealthAppointmentTransition("Atendido", "Cancelado"), HealthAppointmentPolicyError);
});

test("nao permite concluir atendimento cancelado ou faltoso", () => {
  assert.doesNotThrow(() => assertHealthAppointmentCanBeCompleted("Agendado"));
  assert.doesNotThrow(() => assertHealthAppointmentCanBeCompleted("Em Atendimento"));
  assert.throws(() => assertHealthAppointmentCanBeCompleted("Faltou"), HealthAppointmentPolicyError);
  assert.throws(() => assertHealthAppointmentCanBeCompleted("Cancelado"), HealthAppointmentPolicyError);
});

test("nao permite concluir atendimento antes do horario agendado", () => {
  const scheduledAt = new Date("2026-09-20T12:30:00.000Z");
  assert.doesNotThrow(() => assertHealthAppointmentCanBeCompletedAt(scheduledAt, new Date("2026-09-20T12:30:00.000Z")));
  assert.throws(() => assertHealthAppointmentCanBeCompletedAt(scheduledAt, new Date("2026-09-20T12:29:59.999Z")), HealthAppointmentPolicyError);
});

test("interpreta data e horario da agenda no fuso de Brasilia e rejeita datas inexistentes", () => {
  assert.equal(parseBrazilDateTime("2026-09-20T09:30").toISOString(), "2026-09-20T12:30:00.000Z");
  assert.throws(() => parseBrazilDateTime("2026-02-30T09:30"), HealthAppointmentPolicyError);
  assert.throws(() => parseBrazilDateTime("2026-09-20T25:30"), HealthAppointmentPolicyError);
});

test("exige motivo de cancelamento e normaliza valores opcionais", () => {
  assert.throws(() => healthAppointmentTransitionSchema.parse({ appointmentId: "appointment-1", status: "Cancelado", cancellationReason: "" }));
  assert.deepEqual(
    healthAppointmentTransitionSchema.parse({ appointmentId: "appointment-1", status: "Cancelado", cancellationReason: " Reagendamento solicitado " }),
    { appointmentId: "appointment-1", status: "Cancelado", cancellationReason: "Reagendamento solicitado" },
  );
  assert.deepEqual(
    patientInputSchema.parse({ personId: "", cns: "", bloodType: "", referenceUnitId: "", teamId: "", fullName: "", cpf: "", birthDate: "" }),
    { personId: "", cns: null, bloodType: null, referenceUnitId: null, teamId: null, fullName: null, cpf: null, birthDate: null },
  );
});

test("valida limites basicos dos sinais vitais informados", () => {
  const record = healthAppointmentCompletionSchema.parse({
    appointmentId: "appointment-1",
    type: "Triagem",
    bloodPressure: "120/80",
    temperature: "36,5",
    weight: "70.4",
    height: "1.75",
    heartRate: "72",
    chiefComplaint: "",
    evolution: "",
    conduct: "",
  });
  assert.equal(record.temperature, 36.5);
  assert.equal(record.heartRate, 72);
  assert.throws(() => healthAppointmentCompletionSchema.parse({ appointmentId: "appointment-1", type: "Triagem", temperature: "80" }));
  assert.throws(() => healthAppointmentCompletionSchema.parse({ appointmentId: "appointment-1", type: "Triagem", heartRate: "72.5" }));
});
