import { z } from "zod";
import type { Prisma } from "@prisma/client";
import type { AppContext } from "@/lib/platform/tenant-context";
import { assertHealthUnitAccess } from "@/lib/platform/tenant-context";
import { HealthOperationError, runHealthTransaction } from "./appointment-service";
import { writeAuditEvent, auditEventTypes } from "@/lib/platform/audit-evidence";

type Tx = Prisma.TransactionClient;
const ACTIVE_BOOKING = ["Agendado", "Confirmado", "Aguardando", "Em Atendimento"];

const scheduleSchema = z.object({
  kind: z.enum(["FIXO", "DIARIO"]).default("FIXO"),
  unitId: z.string().min(1),
  specialtyId: z.string().min(1).nullable().optional(),
  professionalId: z.string().min(1).nullable().optional(),
  groupId: z.string().min(1).nullable().optional(),
  providerSupplierId: z.string().min(1).nullable().optional(),
  weekday: z.number().int().min(0).max(6).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  totalSlots: z.number().int().positive().max(500),
}).strict();

export async function saveSchedule(context: AppContext, raw: unknown) {
  const input = scheduleSchema.parse(raw);
  assertHealthUnitAccess(context.user, input.unitId);
  if (input.kind === "FIXO" && input.weekday === null) throw new HealthOperationError("Cronograma fixo exige o dia da semana.");
  if (input.kind === "DIARIO" && !input.date) throw new HealthOperationError("Cronograma diário exige a data.");
  return runHealthTransaction(context, async tx => {
    const unit = await tx.healthUnit.findFirst({ where: { id: input.unitId, isActive: true }, select: { id: true } });
    if (!unit) throw new HealthOperationError("Unidade de saúde ativa não encontrada.");
    if (input.professionalId && !await tx.healthProfessional.findFirst({ where: { id: input.professionalId, isActive: true }, select: { id: true } })) throw new HealthOperationError("Profissional ativo não encontrado.");
    if (input.groupId && !await tx.healthSchedulingGroup.findFirst({ where: { id: input.groupId, unitId: input.unitId, isActive: true }, select: { id: true } })) throw new HealthOperationError("Grupo de agendamento inválido para a unidade.");
    const created = await tx.healthCareSchedule.create({
      data: { kind: input.kind, unitId: input.unitId, specialtyId: input.specialtyId || null, professionalId: input.professionalId || null, groupId: input.groupId || null, providerSupplierId: input.providerSupplierId || null, weekday: input.weekday ?? null, date: input.date ? new Date(`${input.date}T12:00:00`) : null, startTime: input.startTime || null, endTime: input.endTime || null, totalSlots: input.totalSlots, createdByUsuarioId: context.user.id },
      select: { id: true },
    });
    await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_SCHEDULE", targetId: created.id });
    return created;
  });
}

export async function transitionSchedule(context: AppContext, scheduleId: string, status: string, blockReason?: string | null) {
  const target = status.trim();
  if (!["Ativo", "Bloqueado", "Cancelado"].includes(target)) throw new HealthOperationError("Situação do cronograma inválida.");
  const schedule = await context.prisma.healthCareSchedule.findUnique({ where: { id: scheduleId }, select: { id: true, unitId: true } });
  if (!schedule) throw new HealthOperationError("Cronograma não encontrado.");
  assertHealthUnitAccess(context.user, schedule.unitId);
  if (target === "Bloqueado" && !(blockReason || "").trim()) throw new HealthOperationError("Informe o motivo do bloqueio.");
  return context.prisma.$transaction(async tx => {
    const updated = await tx.healthCareSchedule.update({ where: { id: scheduleId }, data: { status: target, blockReason: target === "Bloqueado" ? (blockReason || "").trim() : null }, select: { id: true } });
    await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_SCHEDULE", targetId: scheduleId });
    return updated;
  });
}

export async function scheduleAvailability(tx: Tx, scheduleId: string, excludeAppointmentId?: string) {
  const schedule = await tx.healthCareSchedule.findUnique({ where: { id: scheduleId }, select: { id: true, totalSlots: true, status: true, blockReason: true } });
  if (!schedule) throw new HealthOperationError("Cronograma não encontrado.");
  const occupied = await tx.healthAppointment.count({ where: { scheduleId, status: { in: ACTIVE_BOOKING }, ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}) } });
  return { total: schedule.totalSlots, occupied, free: schedule.totalSlots - occupied, status: schedule.status, blockReason: schedule.blockReason };
}

export async function assertSlotAvailable(tx: Tx, scheduleId: string, excludeAppointmentId?: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${scheduleId}))`;
  const availability = await scheduleAvailability(tx, scheduleId, excludeAppointmentId);
  if (availability.status === "Cancelado") throw new HealthOperationError("O cronograma foi cancelado.");
  if (availability.status === "Bloqueado") throw new HealthOperationError(`O cronograma está bloqueado: ${availability.blockReason || "sem motivo informado"}.`);
  if (availability.free <= 0) throw new HealthOperationError("Não há vagas disponíveis neste cronograma (overbooking bloqueado).");
  return availability;
}

async function assertNoHoliday(tx: Tx, date: Date) {
  const day = new Date(date); day.setHours(0, 0, 0, 0);
  const next = new Date(day); next.setDate(next.getDate() + 1);
  const holiday = await tx.calendarEvent.findFirst({ where: { isHoliday: true, date: { gte: day, lt: next } }, select: { title: true } });
  if (holiday) throw new HealthOperationError(`Agendamento bloqueado: ${holiday.title}.`);
}

async function assertCompletePatient(tx: Tx, patientId: string) {
  const patient = await tx.patient.findFirst({ where: { id: patientId }, select: { cns: true, person: { select: { cpf: true, fullName: true } } } });
  if (!patient) throw new HealthOperationError("Paciente não encontrado.");
  if (!patient.person.cpf || !patient.cns) throw new HealthOperationError(`Cadastro incompleto de ${patient.person.fullName}: CPF e CNS são obrigatórios para agendar.`);
}

async function assertNoDuplicateActive(tx: Tx, patientId: string, unitId: string, specialtyId: string | null, specialty: string | null, excludeAppointmentId?: string) {
  const clash = await tx.healthAppointment.findFirst({
    where: {
      patientId, unitId, status: { in: ["Agendado", "Confirmado", "Aguardando"] },
      ...(specialtyId ? { specialtyId } : specialty ? { specialty } : {}),
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
    },
    select: { id: true, date: true },
  });
  if (clash) throw new HealthOperationError(`O paciente já possui agendamento ativo nesta especialidade/unidade (${clash.date.toLocaleDateString("pt-BR")}).`);
}

// Regras de negócio aplicadas a todo agendamento programado.
export async function assertBookingRules(tx: Tx, input: { patientId: string; unitId: string; specialtyId?: string | null; specialty?: string | null; scheduleId?: string | null; date: Date; excludeAppointmentId?: string }) {
  await assertNoHoliday(tx, input.date);
  await assertCompletePatient(tx, input.patientId);
  await assertNoDuplicateActive(tx, input.patientId, input.unitId, input.specialtyId || null, input.specialty || null, input.excludeAppointmentId);
  if (input.scheduleId) await assertSlotAvailable(tx, input.scheduleId, input.excludeAppointmentId);
}

const remanejoSchema = z.object({ appointmentId: z.string().min(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/), professionalId: z.string().min(1).nullable().optional(), reason: z.string().trim().min(3).max(1000) }).strict();

function parseBrazilDateTime(value: string) {
  const parsed = new Date(`${value}:00`);
  if (Number.isNaN(parsed.getTime())) throw new HealthOperationError("Informe data e horário válidos.");
  return parsed;
}

export async function remanejarAppointment(context: AppContext, raw: unknown) {
  const input = remanejoSchema.parse(raw);
  const date = parseBrazilDateTime(input.date);
  return runHealthTransaction(context, async tx => {
    const appointment = await tx.healthAppointment.findUnique({ where: { id: input.appointmentId }, select: { id: true, date: true, status: true, patientId: true, unitId: true, professionalId: true, specialtyId: true, specialty: true, scheduleId: true } });
    if (!appointment) throw new HealthOperationError("Agendamento não encontrado.");
    assertHealthUnitAccess(context.user, appointment.unitId);
    if (!["Agendado", "Confirmado"].includes(appointment.status)) throw new HealthOperationError("Somente agendamentos pendentes podem ser remanejados.");
    await assertNoHoliday(tx, date);
    const professionalId = input.professionalId || appointment.professionalId;
    const clash = await tx.healthAppointment.findFirst({ where: { id: { not: appointment.id }, date, status: { notIn: ["Cancelado", "Faltou"] }, OR: [{ patientId: appointment.patientId }, ...(professionalId ? [{ professionalId }] : [])] }, select: { id: true } });
    if (clash) throw new HealthOperationError("O paciente ou profissional já possui agendamento ativo nesse horário.");
    if (appointment.scheduleId) await assertSlotAvailable(tx, appointment.scheduleId, appointment.id);
    const from = appointment.date.toLocaleString("pt-BR");
    await tx.healthAppointment.update({ where: { id: appointment.id }, data: { date, professionalId } });
    await tx.healthAppointmentEvent.create({ data: { appointmentId: appointment.id, eventType: "REMANEJADO", fromStatus: appointment.status, toStatus: appointment.status, notes: `De ${from} para ${date.toLocaleString("pt-BR")}. Motivo: ${input.reason}`, actorUsuarioId: context.user.id } });
    return { id: appointment.id };
  });
}

const waitlistSchema = z.object({ patientId: z.string().min(1), specialtyId: z.string().min(1).nullable().optional(), scheduleId: z.string().min(1).nullable().optional(), priority: z.enum(["Normal", "Prioridade", "Urgência"]).default("Normal"), notes: z.string().trim().max(1000).nullable().optional() }).strict();

export async function addWaitlist(context: AppContext, raw: unknown) {
  const input = waitlistSchema.parse(raw);
  const patient = await context.prisma.patient.findFirst({ where: { id: input.patientId, status: "Ativo" }, select: { id: true, referenceUnitId: true } });
  if (!patient) throw new HealthOperationError("Paciente ativo não encontrado.");
  if (patient.referenceUnitId) assertHealthUnitAccess(context.user, patient.referenceUnitId);
  if (input.scheduleId) {
    const schedule = await context.prisma.healthCareSchedule.findUnique({ where: { id: input.scheduleId }, select: { unitId: true } });
    if (!schedule) throw new HealthOperationError("Cronograma não encontrado.");
    assertHealthUnitAccess(context.user, schedule.unitId);
  }
  return context.prisma.healthWaitlist.create({ data: { patientId: input.patientId, specialtyId: input.specialtyId || null, scheduleId: input.scheduleId || null, priority: input.priority, notes: input.notes || null, createdByUsuarioId: context.user.id }, select: { id: true } });
}

export async function transitionWaitlist(context: AppContext, waitlistId: string, status: string, convert?: { date: string; unitId: string; professionalId?: string | null }) {
  const target = status.trim();
  if (!["Chamado", "Convertido", "Cancelado"].includes(target)) throw new HealthOperationError("Situação da espera inválida.");
  const entry = await context.prisma.healthWaitlist.findUnique({ where: { id: waitlistId }, include: { patient: { select: { referenceUnitId: true } }, schedule: { select: { unitId: true } } } });
  if (!entry) throw new HealthOperationError("Registro de espera não encontrado.");
  if (entry.status !== "Aguardando" && target !== "Cancelado") throw new HealthOperationError("Somente esperas aguardando podem ser chamadas ou convertidas.");
  if (entry.patient.referenceUnitId) assertHealthUnitAccess(context.user, entry.patient.referenceUnitId);
  if (target === "Convertido") {
    if (!convert?.date || !convert?.unitId) throw new HealthOperationError("Informe data e unidade para converter a espera em agendamento.");
    const { createHealthAppointment } = await import("./appointment-service");
    await createHealthAppointment(context, { patientId: entry.patientId, unitId: convert.unitId, professionalId: convert.professionalId || null, date: convert.date, specialtyId: entry.specialtyId, priority: entry.priority as "Normal" | "Prioridade" | "Urgência", scheduleId: entry.scheduleId });
  }
  return context.prisma.healthWaitlist.update({ where: { id: waitlistId }, data: { status: target }, select: { id: true } });
}
