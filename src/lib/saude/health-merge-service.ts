import type { Prisma, PrismaClient } from "@prisma/client";
import { assertAddressMergeCriteria, assertPatientMergeCriteria, assertProfessionalMergeCriteria } from "./health-merge-policy";

type MergeInput = { kind: "ADDRESS" | "PATIENT" | "PROFESSIONAL"; targetId: string; sourceId: string; actorUsuarioId: string };

async function transferProfessionalLinks(tx: Prisma.TransactionClient, targetId: string, sourceId: string) {
  const moved: Record<string, number> = {};
  const direct = [
    ["healthAppointment", tx.healthAppointment], ["medicalRecord", tx.medicalRecord], ["healthPrescription", tx.healthPrescription],
    ["vaccinationRecord", tx.vaccinationRecord], ["healthExamRequest", tx.healthExamRequest], ["healthReferral", tx.healthReferral],
  ] as const;
  for (const [name, model] of direct) moved[name] = (await (model.updateMany as typeof tx.healthAppointment.updateMany)({ where: { professionalId: sourceId }, data: { professionalId: targetId } })).count;

  const sourceAssignments = await tx.healthProfessionalAssignment.findMany({ where: { professionalId: sourceId }, select: { id: true, unitId: true, specialtyId: true } });
  for (const link of sourceAssignments) {
    const duplicate = await tx.healthProfessionalAssignment.findFirst({ where: { professionalId: targetId, unitId: link.unitId, specialtyId: link.specialtyId }, select: { id: true } });
    await tx.healthProfessionalAssignment.update({ where: { id: link.id }, data: duplicate ? { isActive: false } : { professionalId: targetId } });
  }
  const services = await tx.healthServiceAssignment.findMany({ where: { professionalId: sourceId }, select: { id: true, serviceId: true } });
  for (const link of services) {
    const duplicate = await tx.healthServiceAssignment.findFirst({ where: { professionalId: targetId, serviceId: link.serviceId }, select: { id: true } });
    await tx.healthServiceAssignment.update({ where: { id: link.id }, data: duplicate ? { isActive: false } : { professionalId: targetId } });
  }
  const habilitations = await tx.healthHabilitation.findMany({ where: { professionalId: sourceId }, select: { id: true, code: true } });
  for (const link of habilitations) {
    const duplicate = await tx.healthHabilitation.findFirst({ where: { professionalId: targetId, code: link.code }, select: { id: true } });
    await tx.healthHabilitation.update({ where: { id: link.id }, data: duplicate ? { isActive: false } : { professionalId: targetId } });
  }
  moved.assignments = sourceAssignments.length;
  moved.services = services.length;
  moved.habilitations = habilitations.length;
  moved.statusHistory = (await tx.healthRegistrationStatusHistory.updateMany({ where: { professionalId: sourceId }, data: { professionalId: targetId } })).count;
  return moved;
}

export async function executeHealthAdministrativeMerge(prisma: PrismaClient, input: MergeInput) {
  if (!input.targetId || !input.sourceId || input.targetId === input.sourceId) throw new Error("Selecione registros de origem e principal diferentes.");
  return prisma.$transaction(async tx => {
    let criteria: Prisma.InputJsonObject;
    let result: Prisma.InputJsonObject;
    if (input.kind === "ADDRESS") {
      const [target, source] = await Promise.all([tx.address.findUnique({ where: { id: input.targetId } }), tx.address.findUnique({ where: { id: input.sourceId } })]);
      if (!target || !source) throw new Error("Endereço não encontrado.");
      if (source.canonicalAddressId) throw new Error("O endereço de origem já foi unificado.");
      criteria = assertAddressMergeCriteria(target, source);
      await tx.address.update({ where: { id: source.id }, data: { canonicalAddressId: target.id } });
      result = { canonicalAddressId: target.id, preservedAddressId: source.id };
    } else if (input.kind === "PATIENT") {
      const select = { id: true, status: true, person: { select: { fullName: true, birthDate: true, motherName: true } } } as const;
      const [target, source] = await Promise.all([tx.patient.findUnique({ where: { id: input.targetId }, select }), tx.patient.findUnique({ where: { id: input.sourceId }, select })]);
      if (!target || !source || target.status === "Unificado" || source.status === "Unificado") throw new Error("Prontuário ativo não encontrado.");
      criteria = assertPatientMergeCriteria(target.person, source.person);
      const moved = {
        appointments: (await tx.healthAppointment.updateMany({ where: { patientId: source.id }, data: { patientId: target.id } })).count,
        records: (await tx.medicalRecord.updateMany({ where: { patientId: source.id }, data: { patientId: target.id } })).count,
        prescriptions: (await tx.healthPrescription.updateMany({ where: { patientId: source.id }, data: { patientId: target.id } })).count,
        dispensations: (await tx.medicineDispensation.updateMany({ where: { patientId: source.id }, data: { patientId: target.id } })).count,
        vaccinations: (await tx.vaccinationRecord.updateMany({ where: { patientId: source.id }, data: { patientId: target.id } })).count,
        examRequests: (await tx.healthExamRequest.updateMany({ where: { patientId: source.id }, data: { patientId: target.id } })).count,
        referrals: (await tx.healthReferral.updateMany({ where: { patientId: source.id }, data: { patientId: target.id } })).count,
      };
      await tx.patient.update({ where: { id: source.id }, data: { status: "Unificado" } });
      result = { moved, sourceStatus: "Unificado" };
    } else {
      const select = { id: true, isActive: true, employee: { select: { name: true } } } as const;
      const [target, source] = await Promise.all([tx.healthProfessional.findUnique({ where: { id: input.targetId }, select }), tx.healthProfessional.findUnique({ where: { id: input.sourceId }, select })]);
      if (!target || !source || !target.isActive || !source.isActive) throw new Error("Profissional ativo não encontrado.");
      criteria = assertProfessionalMergeCriteria(target.employee.name, source.employee.name);
      const moved = await transferProfessionalLinks(tx, target.id, source.id);
      await tx.healthProfessional.update({ where: { id: source.id }, data: { isActive: false, inactivatedAt: new Date(), inactivationReason: `Unificado ao profissional ${target.id}` } });
      result = { moved, sourceStatus: "Inativo por unificação" };
    }
    const merge = await tx.healthAdministrativeMerge.create({ data: { kind: input.kind, targetId: input.targetId, sourceIds: [input.sourceId], criteria, result, actorUsuarioId: input.actorUsuarioId } });
    return merge.id;
  });
}
