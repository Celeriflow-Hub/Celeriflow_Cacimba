import { Prisma } from "@prisma/client";
import type { AppContext } from "@/lib/platform/tenant-context";
import { assertHealthUnitAccess } from "@/lib/platform/tenant-context";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import {
  healthAppointmentCompletionSchema,
  healthAppointmentCreateSchema,
  healthAppointmentTransitionSchema,
  healthTriageInputSchema,
  spontaneousCareCreateSchema,
} from "./contract";
import {
  assertHealthAppointmentCanBeCompletedAt,
  assertHealthAppointmentCanBeCompleted,
  assertHealthAppointmentTransition,
  parseBrazilDateTime,
} from "./appointment-policy";

type Tx = Prisma.TransactionClient;

export class HealthOperationError extends Error {}

export async function runHealthTransaction<T>(context: Pick<AppContext, "prisma">, operation: (tx: Tx) => Promise<T>) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await context.prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15000,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
      throw error;
    }
  }
  throw new HealthOperationError("Nao foi possivel confirmar a operacao concorrente. Reabra a agenda e tente novamente.");
}

async function requireActiveAppointmentReferences(tx: Tx, patientId: string, unitId: string, professionalId: string | null) {
  const [patient, unit] = await Promise.all([
    tx.patient.findFirst({ where: { id: patientId, status: "Ativo" }, select: { id: true } }),
    tx.healthUnit.findFirst({ where: { id: unitId, isActive: true }, select: { id: true } }),
  ]);

  if (!patient) throw new HealthOperationError("Paciente nao encontrado ou inativo.");
  if (!unit) throw new HealthOperationError("Unidade de saude nao encontrada ou inativa.");

  if (!professionalId) return null;
  const professional = await tx.healthProfessional.findFirst({
    where: { id: professionalId, isActive: true },
    select: { id: true, unitId: true, employee: { select: { isActive: true } } },
  });
  if (!professional || !professional.employee.isActive) throw new HealthOperationError("Profissional nao encontrado ou inativo.");
  if (professional.unitId && professional.unitId !== unitId) {
    throw new HealthOperationError("O profissional selecionado deve pertencer a unidade do agendamento.");
  }
  return professional;
}

async function patientMunicipalitySnapshot(tx: Tx, patientId: string) {
  const patient = await tx.patient.findUnique({ where: { id: patientId }, select: { person: { select: { addresses: { where: { canonicalAddressId: null }, orderBy: { createdAt: "desc" }, take: 1, select: { neighborhood: { select: { city: true, state: true } } } } } } } });
  const place = patient?.person.addresses[0]?.neighborhood;
  return { municipalitySnapshot: place?.city || null, stateSnapshot: place?.state || null };
}

async function validateSchedulingReferences(tx: Tx, unitId: string, schedulingGroupId: string | null, specialtyId: string | null, serviceId: string | null) {
  if (specialtyId && !await tx.healthUnitSpecialty.findFirst({ where: { unitId, specialtyId, isActive: true }, select: { id: true } })) throw new HealthOperationError("Especialidade não está ativa na unidade selecionada.");
  if (serviceId && !await tx.healthServiceAssignment.findFirst({ where: { unitId, serviceId, isActive: true }, select: { id: true } })) throw new HealthOperationError("Serviço não está ativo na unidade selecionada.");
  if (schedulingGroupId) {
    const group = await tx.healthSchedulingGroup.findFirst({ where: { id: schedulingGroupId, unitId, isActive: true }, select: { specialtyGroupId: true } });
    if (!group) throw new HealthOperationError("Grupo de agendamento não pertence à unidade selecionada.");
    if (specialtyId && !await tx.healthSpecialtyGroupMember.findFirst({ where: { groupId: group.specialtyGroupId, specialtyId }, select: { id: true } })) throw new HealthOperationError("Especialidade não pertence ao grupo de especialidades do agendamento.");
    if (serviceId && !await tx.healthSpecialtyGroupService.findFirst({ where: { groupId: group.specialtyGroupId, serviceId }, select: { id: true } })) throw new HealthOperationError("Serviço não pertence ao grupo de especialidades do agendamento.");
  }
}

export async function createHealthAppointment(context: AppContext, raw: unknown) {
  const input = healthAppointmentCreateSchema.parse(raw);
  const date = parseBrazilDateTime(input.date);
  assertHealthUnitAccess(context.user, input.unitId);

  return runHealthTransaction(context, async tx => {
    await requireActiveAppointmentReferences(tx, input.patientId, input.unitId, input.professionalId);
    await validateSchedulingReferences(tx, input.unitId, input.schedulingGroupId, input.specialtyId, input.serviceId);
    const { assertBookingRules } = await import("./schedule-service");
    await assertBookingRules(tx, { patientId: input.patientId, unitId: input.unitId, specialtyId: input.specialtyId || null, specialty: input.specialty || null, scheduleId: input.scheduleId || null, date });
    const conflict = await tx.healthAppointment.findFirst({
      where: {
        date,
        status: { notIn: ["Cancelado", "Faltou"] },
        OR: [
          { patientId: input.patientId },
          ...(input.professionalId ? [{ professionalId: input.professionalId }] : []),
        ],
      },
      select: { id: true },
    });
    if (conflict) {
      throw new HealthOperationError("O paciente ou profissional ja possui um agendamento ativo nesse horario.");
    }

    const snapshot = await patientMunicipalitySnapshot(tx, input.patientId);
    const appointment = await tx.healthAppointment.create({
      data: {
        date,
        patientId: input.patientId,
        unitId: input.unitId,
        professionalId: input.professionalId,
        scheduleId: input.scheduleId || null,
        visitType: input.visitType || null,
        specialty: input.specialty,
        schedulingGroupId: input.schedulingGroupId,
        specialtyId: input.specialtyId,
        serviceId: input.serviceId,
        priority: input.priority,
        status: "Agendado",
        ...snapshot,
      },
      select: { id: true },
    });
    await tx.healthAppointmentEvent.create({ data: { appointmentId: appointment.id, eventType: "SCHEDULED", toStatus: "Agendado", actorUsuarioId: context.user.id } });
    await writeAuditEvent(tx, {
      actorUsuarioId: context.user.id,
      eventType: auditEventTypes.administrativeMutation,
      targetType: "HEALTH_APPOINTMENT",
      targetId: appointment.id,
    });
    return appointment;
  });
}

export async function transitionHealthAppointment(context: AppContext, raw: unknown) {
  const input = healthAppointmentTransitionSchema.parse(raw);

  return runHealthTransaction(context, async tx => {
    const appointment = await tx.healthAppointment.findUnique({
      where: { id: input.appointmentId },
      select: { id: true, unitId: true, status: true, medicalRecord: { select: { id: true } } },
    });
    if (!appointment) throw new HealthOperationError("Agendamento nao encontrado.");
    assertHealthUnitAccess(context.user, appointment.unitId);
    if (appointment.medicalRecord) throw new HealthOperationError("O agendamento ja possui prontuario e seu status esta protegido.");
    assertHealthAppointmentTransition(appointment.status, input.status);

    const updated = await tx.healthAppointment.update({
      where: { id: appointment.id },
      data: input.status === "Cancelado"
        ? { status: input.status, cancelledAt: new Date(), cancellationReason: input.cancellationReason }
        : { status: input.status, cancelledAt: null, cancellationReason: null, ...(input.status === "Confirmado" ? { confirmedAt: new Date() } : {}), ...(input.status === "Aguardando" ? { arrivedAt: new Date() } : {}), ...(input.status === "Em Atendimento" ? { startedAt: new Date() } : {}) },
      select: { id: true },
    });
    await tx.healthAppointmentEvent.create({ data: { appointmentId: appointment.id, eventType: input.status === "Cancelado" ? "CANCELLED" : "STATUS_CHANGED", fromStatus: appointment.status, toStatus: input.status, notes: input.cancellationReason, actorUsuarioId: context.user.id } });
    await writeAuditEvent(tx, {
      actorUsuarioId: context.user.id,
      eventType: auditEventTypes.administrativeMutation,
      targetType: "HEALTH_APPOINTMENT",
      targetId: updated.id,
    });
    return updated;
  });
}

export async function createSpontaneousCare(context: AppContext, raw: unknown) {
  const input = spontaneousCareCreateSchema.parse(raw);
  assertHealthUnitAccess(context.user, input.unitId);
  return runHealthTransaction(context, async tx => {
    await requireActiveAppointmentReferences(tx, input.patientId, input.unitId, input.professionalId);
    await validateSchedulingReferences(tx, input.unitId, null, input.specialtyId, input.serviceId);
    const snapshot = await patientMunicipalitySnapshot(tx, input.patientId);
    const appointment = await tx.healthAppointment.create({ data: { date: new Date(), origin: "SPONTANEOUS", status: "Aguardando", priority: input.priority, patientId: input.patientId, unitId: input.unitId, professionalId: input.professionalId, specialtyId: input.specialtyId, serviceId: input.serviceId, arrivalNotes: input.arrivalNotes, arrivedAt: new Date(), ...snapshot }, select: { id: true } });
    await tx.healthAppointmentEvent.create({ data: { appointmentId: appointment.id, eventType: "SPONTANEOUS_ARRIVAL", toStatus: "Aguardando", notes: input.arrivalNotes, actorUsuarioId: context.user.id } });
    return appointment;
  });
}

export async function registerHealthTriage(context: AppContext, raw: unknown) {
  const input = healthTriageInputSchema.parse(raw);
  if (!context.user.employeeId) throw new HealthOperationError("Vincule o usuário a um profissional de saúde para registrar o acolhimento.");
  return runHealthTransaction(context, async tx => {
    const professional = await tx.healthProfessional.findFirst({ where: { employeeId: context.user.employeeId!, isActive: true }, select: { id: true } });
    if (!professional) throw new HealthOperationError("Profissional de saúde ativo não encontrado.");
    const appointment = await tx.healthAppointment.findUnique({ where: { id: input.appointmentId }, select: { id: true, unitId: true, status: true } });
    if (!appointment) throw new HealthOperationError("Atendimento não encontrado.");
    assertHealthUnitAccess(context.user, appointment.unitId);
    if (appointment.status !== "Aguardando") throw new HealthOperationError("Registre a chegada do paciente antes do acolhimento.");
    const triage = await tx.healthTriage.upsert({ where: { appointmentId: appointment.id }, create: { ...input, professionalId: professional.id }, update: { ...input, professionalId: professional.id }, select: { id: true } });
    await tx.healthAppointment.update({ where: { id: appointment.id }, data: { triagedAt: new Date(), status: "Aguardando", priority: input.priorityLabel } });
    await tx.healthAppointmentEvent.create({ data: { appointmentId: appointment.id, eventType: "TRIAGED", fromStatus: appointment.status, toStatus: "Aguardando", notes: input.riskClassification, actorUsuarioId: context.user.id } });
    return triage;
  });
}

export async function callHealthAppointment(context: AppContext, appointmentId: string) {
  return runHealthTransaction(context, async tx => {
    const appointment = await tx.healthAppointment.findUnique({ where: { id: appointmentId }, select: { id: true, unitId: true, status: true } });
    if (!appointment || appointment.status !== "Aguardando") throw new HealthOperationError("Atendimento não está aguardando na fila.");
    assertHealthUnitAccess(context.user, appointment.unitId);
    await tx.healthAppointment.update({ where: { id: appointment.id }, data: { calledAt: new Date() } });
    await tx.healthAppointmentEvent.create({ data: { appointmentId: appointment.id, eventType: "CALLED", fromStatus: appointment.status, toStatus: appointment.status, actorUsuarioId: context.user.id } });
    return appointment;
  });
}

export async function completeHealthAppointment(context: AppContext, raw: unknown) {
  const input = healthAppointmentCompletionSchema.parse(raw);
  if (!context.user.employeeId) {
    throw new HealthOperationError("Vincule o usuario autenticado a um profissional de saude para registrar atendimento.");
  }

  try {
    return await runHealthTransaction(context, async tx => {
      const professional = await tx.healthProfessional.findFirst({
        where: { employeeId: context.user.employeeId!, isActive: true },
        select: { id: true, unitId: true, employee: { select: { isActive: true } } },
      });
      if (!professional || !professional.employee.isActive) throw new HealthOperationError("O servidor autenticado nao possui cadastro ativo como profissional de saude.");

      const appointment = await tx.healthAppointment.findUnique({
        where: { id: input.appointmentId },
        select: {
          id: true,
          date: true,
          status: true,
          patientId: true,
          unitId: true,
          professionalId: true,
          medicalRecord: { select: { id: true } },
        },
      });
      if (!appointment) throw new HealthOperationError("Agendamento nao encontrado.");
      assertHealthUnitAccess(context.user, appointment.unitId);
      if (appointment.medicalRecord) throw new HealthOperationError("Este agendamento ja possui um prontuario registrado.");
      assertHealthAppointmentCanBeCompleted(appointment.status);
      assertHealthAppointmentCanBeCompletedAt(appointment.date);
      if (appointment.professionalId && appointment.professionalId !== professional.id) {
        throw new HealthOperationError("O agendamento pertence a outro profissional de saude.");
      }
      if (professional.unitId && professional.unitId !== appointment.unitId) {
        throw new HealthOperationError("O profissional autenticado nao esta vinculado a unidade deste agendamento.");
      }
      const professionalConflict = await tx.healthAppointment.findFirst({
        where: {
          id: { not: appointment.id },
          date: appointment.date,
          professionalId: professional.id,
          status: { notIn: ["Cancelado", "Faltou"] },
        },
        select: { id: true },
      });
      if (professionalConflict) {
        throw new HealthOperationError("O profissional autenticado ja possui outro agendamento ativo nesse horario.");
      }

      const record = await tx.medicalRecord.create({
        data: {
          type: input.type,
          bloodPressure: input.bloodPressure,
          temperature: input.temperature,
          weight: input.weight,
          height: input.height,
          heartRate: input.heartRate,
          chiefComplaint: input.chiefComplaint,
          evolution: input.evolution,
          conduct: input.conduct,
          patientId: appointment.patientId,
          unitId: appointment.unitId,
          professionalId: professional.id,
          appointmentId: appointment.id,
        },
        select: { id: true },
      });
      await tx.healthAppointment.update({
        where: { id: appointment.id },
        data: { status: "Atendido", professionalId: professional.id },
      });
      await writeAuditEvent(tx, {
        actorUsuarioId: context.user.id,
        eventType: auditEventTypes.administrativeMutation,
        targetType: "MEDICAL_RECORD",
        targetId: record.id,
      });
      await writeAuditEvent(tx, {
        actorUsuarioId: context.user.id,
        eventType: auditEventTypes.administrativeMutation,
        targetType: "HEALTH_APPOINTMENT",
        targetId: appointment.id,
      });
      return record;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HealthOperationError("Este agendamento ja possui um prontuario registrado.");
    }
    throw error;
  }
}
