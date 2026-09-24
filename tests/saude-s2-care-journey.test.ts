import assert from "node:assert/strict";
import test from "node:test";
import { healthTriageInputSchema, spontaneousCareCreateSchema } from "../src/lib/saude/contract.ts";
import { concludeCareSchema, diagnosisInputSchema, prescriptionInputSchema } from "../src/lib/saude/care-contract.ts";

test("demanda espontânea exige paciente, unidade e motivo da procura", () => {
  const input = spontaneousCareCreateSchema.parse({ patientId: "patient-1", unitId: "unit-1", professionalId: null, specialtyId: null, serviceId: null, arrivalNotes: "Dor abdominal", priority: "Normal" });
  assert.equal(input.arrivalNotes, "Dor abdominal");
  assert.throws(() => spontaneousCareCreateSchema.parse({ patientId: "", unitId: "unit-1", arrivalNotes: "", priority: "Normal" }));
});

test("acolhimento valida sinais vitais e classificação de risco", () => {
  const input = healthTriageInputSchema.parse({ appointmentId: "appointment-1", chiefComplaint: "Febre", bloodPressure: "120/80", temperature: "38,2", weight: "70", height: "1,70", heartRate: "90", respiratoryRate: "18", oxygenSaturation: "97", bloodGlucose: "100", observedConditions: "Consciente", riskClassification: "Pouco urgente", priorityLabel: "Pouco urgente", notes: "" });
  assert.equal(input.temperature, 38.2);
  assert.equal(input.notes, null);
  assert.throws(() => healthTriageInputSchema.parse({ ...input, oxygenSaturation: 110 }));
});

test("diagnóstico, prescrição e desfecho possuem contratos persistentes", () => {
  assert.equal(diagnosisInputSchema.parse({ medicalRecordId: "record-1", cidReferenceId: "cid-1", isPrimary: true, notes: "" }).notes, null);
  const prescription = prescriptionInputSchema.parse({ medicalRecordId: "record-1", medicineId: null, medicineName: "Dipirona", presentation: null, dose: "500 mg", route: "Oral", frequency: "8/8 horas", duration: "3 dias", quantity: 9, instructions: null });
  assert.equal(prescription.quantity, 9);
  assert.equal(concludeCareSchema.parse({ medicalRecordId: "record-1", outcome: "Alta", conduct: "Orientações e retorno se necessário." }).outcome, "Alta");
});
