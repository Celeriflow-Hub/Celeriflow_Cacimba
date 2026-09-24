import type { Prisma } from "@prisma/client";
import type { AppContext } from "@/lib/platform/tenant-context";
import { assertHealthUnitAccess } from "@/lib/platform/tenant-context";
import { HealthOperationError, runHealthTransaction } from "./appointment-service";
import { assertHealthAppointmentCanBeCompleted, assertHealthAppointmentCanBeCompletedAt } from "./appointment-policy";
import { clinicalEvolutionSchema, concludeCareSchema, diagnosisInputSchema, examRequestInputSchema, medicalRecordNarrativeSchema, performedProcedureInputSchema, prescriptionInputSchema, referralInputSchema } from "./care-contract";
import { uploadFile } from "@/lib/platform/blob";
import { ingestGedDocument } from "@/lib/documents/document-flow-service";

type Tx = Prisma.TransactionClient;

async function currentProfessional(tx: Tx, context: AppContext) {
  if (!context.user.employeeId) throw new HealthOperationError("Vincule o usuário autenticado a um profissional de saúde.");
  const professional = await tx.healthProfessional.findFirst({ where: { employeeId: context.user.employeeId, isActive: true, employee: { isActive: true } }, select: { id: true, unitId: true, assignments: { where: { isActive: true }, select: { unitId: true } } } });
  if (!professional) throw new HealthOperationError("Profissional de saúde ativo não encontrado.");
  return professional;
}

async function activeRecord(tx: Tx, context: AppContext, medicalRecordId: string) {
  const record = await tx.medicalRecord.findUnique({ where: { id: medicalRecordId }, select: { id: true, patientId: true, unitId: true, professionalId: true, completedAt: true, appointmentId: true } });
  if (!record) throw new HealthOperationError("Prontuário de atendimento não encontrado.");
  assertHealthUnitAccess(context.user, record.unitId);
  if (record.completedAt) throw new HealthOperationError("O atendimento concluído está disponível somente para consulta.");
  const professional = await currentProfessional(tx, context);
  if (record.professionalId !== professional.id) throw new HealthOperationError("O prontuário pertence a outro profissional de saúde.");
  return record;
}

export async function startHealthCare(context: AppContext, appointmentId: string) {
  return runHealthTransaction(context, async tx => {
    const professional = await currentProfessional(tx, context);
    const appointment = await tx.healthAppointment.findUnique({ where: { id: appointmentId }, select: { id: true, date: true, origin: true, status: true, patientId: true, unitId: true, professionalId: true, medicalRecord: { select: { id: true } }, triage: true } });
    if (!appointment) throw new HealthOperationError("Atendimento não encontrado.");
    assertHealthUnitAccess(context.user, appointment.unitId);
    if (professional.unitId !== appointment.unitId && !professional.assignments.some(item => item.unitId === appointment.unitId)) throw new HealthOperationError("O profissional autenticado não possui vínculo ativo com a unidade do atendimento.");
    if (appointment.professionalId && appointment.professionalId !== professional.id) throw new HealthOperationError("O atendimento pertence a outro profissional.");
    if (appointment.medicalRecord) return appointment.medicalRecord;
    assertHealthAppointmentCanBeCompleted(appointment.status);
    if (!["Aguardando", "Em Atendimento"].includes(appointment.status)) throw new HealthOperationError("Registre a chegada do paciente antes de iniciar o atendimento.");
    if (appointment.origin === "SCHEDULED") assertHealthAppointmentCanBeCompletedAt(appointment.date);
    const record = await tx.medicalRecord.create({ data: { type: "Consulta", patientId: appointment.patientId, unitId: appointment.unitId, professionalId: professional.id, appointmentId: appointment.id, bloodPressure: appointment.triage?.bloodPressure, temperature: appointment.triage?.temperature, weight: appointment.triage?.weight, height: appointment.triage?.height, heartRate: appointment.triage?.heartRate, respiratoryRate: appointment.triage?.respiratoryRate, oxygenSaturation: appointment.triage?.oxygenSaturation, bloodGlucose: appointment.triage?.bloodGlucose, chiefComplaint: appointment.triage?.chiefComplaint }, select: { id: true } });
    await tx.healthAppointment.update({ where: { id: appointment.id }, data: { status: "Em Atendimento", startedAt: new Date(), professionalId: professional.id } });
    await tx.healthAppointmentEvent.create({ data: { appointmentId: appointment.id, eventType: "CARE_STARTED", fromStatus: appointment.status, toStatus: "Em Atendimento", actorUsuarioId: context.user.id } });
    return record;
  });
}

export async function saveMedicalRecordNarrative(context: AppContext, raw: unknown) {
  const input = medicalRecordNarrativeSchema.parse(raw);
  return runHealthTransaction(context, async tx => { await activeRecord(tx, context, input.medicalRecordId); return tx.medicalRecord.update({ where: { id: input.medicalRecordId }, data: { anamnesis: input.anamnesis, assessment: input.assessment, evolution: input.evolution, conduct: input.conduct, observations: input.observations }, select: { id: true } }); });
}

export async function addClinicalEvolution(context: AppContext, raw: unknown) {
  const input = clinicalEvolutionSchema.parse(raw);
  return runHealthTransaction(context, async tx => { const record = await activeRecord(tx, context, input.medicalRecordId); const professional = await currentProfessional(tx, context); return tx.healthClinicalEvolution.create({ data: { medicalRecordId: record.id, professionalId: professional.id, content: input.content }, select: { id: true } }); });
}

export async function addHealthDiagnosis(context: AppContext, raw: unknown) {
  const input = diagnosisInputSchema.parse(raw);
  return runHealthTransaction(context, async tx => { await activeRecord(tx, context, input.medicalRecordId); const cid = await tx.healthSusReference.findFirst({ where: { id: input.cidReferenceId, kind: "CID", isActive: true, isCurrent: true }, select: { id: true } }); if (!cid) throw new HealthOperationError("CID ativo não encontrado."); if (input.isPrimary) await tx.healthDiagnosis.updateMany({ where: { medicalRecordId: input.medicalRecordId }, data: { isPrimary: false } }); return tx.healthDiagnosis.upsert({ where: { medicalRecordId_cidReferenceId: { medicalRecordId: input.medicalRecordId, cidReferenceId: cid.id } }, create: input, update: { isPrimary: input.isPrimary, notes: input.notes }, select: { id: true } }); });
}

export async function addHealthPrescription(context: AppContext, raw: unknown) {
  const input = prescriptionInputSchema.parse(raw);
  return runHealthTransaction(context, async tx => { const record = await activeRecord(tx, context, input.medicalRecordId); const professional = await currentProfessional(tx, context); if (input.medicineId && !await tx.medicine.findFirst({ where: { id: input.medicineId, isActive: true }, select: { id: true } })) throw new HealthOperationError("Medicamento ativo não encontrado."); return tx.healthPrescription.create({ data: { patientId: record.patientId, professionalId: professional.id, unitId: record.unitId, medicalRecordId: record.id, content: `${input.medicineName} · ${input.dose} · ${input.frequency}`, items: { create: { medicineId: input.medicineId, medicineName: input.medicineName, presentation: input.presentation, dose: input.dose, route: input.route, frequency: input.frequency, duration: input.duration, quantity: input.quantity, instructions: input.instructions } } }, select: { id: true } }); });
}

export async function addHealthExamRequest(context: AppContext, raw: unknown) {
  const input = examRequestInputSchema.parse(raw);
  return runHealthTransaction(context, async tx => {
    const record = await activeRecord(tx, context, input.medicalRecordId);
    const professional = await currentProfessional(tx, context);
    if (input.procedureId && !await tx.healthSusProcedure.findFirst({ where: { id: input.procedureId, isActive: true, isCurrent: true }, select: { id: true } })) throw new HealthOperationError("Procedimento de exame não encontrado.");
    const request = await tx.healthExamRequest.create({ data: { patientId: record.patientId, professionalId: professional.id, unitId: record.unitId, medicalRecordId: record.id, procedureId: input.procedureId, examName: input.examName, reason: input.indication, indication: input.indication, priority: input.priority, notes: input.notes }, select: { id: true } });
    const examModel = input.procedureId ? await tx.healthLabExamModel.findFirst({ where: { procedureId: input.procedureId, isActive: true }, select: { id: true } }) : null;
    await tx.healthLabOrder.create({ data: { examRequestId: request.id, examModelId: examModel?.id, patientId: record.patientId, requestUnitId: record.unitId, priority: input.priority.toUpperCase(), idempotencyKey: `exam-request:${request.id}`, createdByUsuarioId: context.user.id } });
    return request;
  });
}

export async function addPerformedProcedure(context: AppContext, raw: unknown) {
  const input = performedProcedureInputSchema.parse(raw);
  return runHealthTransaction(context, async tx => { const record = await activeRecord(tx, context, input.medicalRecordId); const professional = await currentProfessional(tx, context); if (!await tx.healthSusProcedure.findFirst({ where: { id: input.procedureId, isActive: true, isCurrent: true }, select: { id: true } })) throw new HealthOperationError("Procedimento ativo não encontrado."); return tx.healthPerformedProcedure.create({ data: { medicalRecordId: record.id, procedureId: input.procedureId, professionalId: professional.id, quantity: input.quantity, notes: input.notes }, select: { id: true } }); });
}

export async function addHealthReferral(context: AppContext, raw: unknown) {
  const input = referralInputSchema.parse(raw);
  return runHealthTransaction(context, async tx => {
    const record = await activeRecord(tx, context, input.medicalRecordId);
    const professional = await currentProfessional(tx, context);
    const referral = await tx.healthReferral.create({ data: { patientId: record.patientId, professionalId: professional.id, medicalRecordId: record.id, specialtyId: input.specialtyId, serviceId: input.serviceId, destinationUnitId: input.destinationUnitId, specialty: input.specialty, priority: input.priority, reason: input.reason, observation: input.observation }, select: { id: true, patientId: true, specialtyId: true, serviceId: true, destinationUnitId: true, professionalId: true, priority: true, reason: true } });
    const { createFromReferralTx } = await import("./regulation-service");
    await createFromReferralTx(tx, { id: referral.id, patientId: referral.patientId, specialtyId: referral.specialtyId, serviceId: referral.serviceId, destinationUnitId: referral.destinationUnitId, professionalId: referral.professionalId, priority: referral.priority, reason: referral.reason }, context.user.id);
    return { id: referral.id };
  });
}

export async function concludeHealthCare(context: AppContext, raw: unknown) {
  const input = concludeCareSchema.parse(raw);
  return runHealthTransaction(context, async tx => { const record = await activeRecord(tx, context, input.medicalRecordId); const professional = await currentProfessional(tx, context); if (record.professionalId !== professional.id) throw new HealthOperationError("Somente o profissional responsável pode concluir o atendimento."); const now = new Date(); await tx.medicalRecord.update({ where: { id: record.id }, data: { outcome: input.outcome, conduct: input.conduct, completedAt: now } }); if (record.appointmentId) { await tx.healthAppointment.update({ where: { id: record.appointmentId }, data: { status: "Atendido", outcome: input.outcome, completedAt: now } }); await tx.healthAppointmentEvent.create({ data: { appointmentId: record.appointmentId, eventType: "CARE_COMPLETED", fromStatus: "Em Atendimento", toStatus: "Atendido", notes: input.outcome, actorUsuarioId: context.user.id } }); } return { id: record.id }; });
}

export async function addHealthClinicalDocument(context: AppContext, input: { medicalRecordId: string; kind: string; title: string; file: File }) {
  const kind = input.kind.trim();
  const title = input.title.trim();
  if (!kind || kind.length > 100 || !title || title.length > 200) throw new HealthOperationError("Informe o tipo e o título do documento clínico.");
  const record = await context.prisma.medicalRecord.findUnique({ where: { id: input.medicalRecordId }, select: { id: true, unitId: true, completedAt: true } });
  if (!record) throw new HealthOperationError("Prontuário de atendimento não encontrado.");
  assertHealthUnitAccess(context.user, record.unitId);
  if (record.completedAt) throw new HealthOperationError("O atendimento concluído não aceita novos documentos.");
  if (!context.user.employeeId || !await context.prisma.healthProfessional.findFirst({ where: { employeeId: context.user.employeeId, records: { some: { id: record.id } } }, select: { id: true } })) throw new HealthOperationError("Somente o profissional responsável pode anexar documentos ao atendimento.");
  const blob = await uploadFile(input.file);
  const content = new Uint8Array(await input.file.arrayBuffer());
  const result = await ingestGedDocument(context.prisma, { title, documentType: kind, documentClassCode: "SAUDE_DOCUMENTO_PADRAO", fileUrl: blob.url, content, actorUsuarioId: context.user.id, afterCreate: async (tx, documentId) => { await tx.healthClinicalDocument.create({ data: { medicalRecordId: record.id, documentId, kind, addedByUsuarioId: context.user.id } }); } });
  return { id: result.documentId };
}
