"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AccessError, getTenantContextForModuleOperation, getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { HealthOperationError, runHealthTransaction } from "@/lib/saude/appointment-service";
import { adminAuth } from "@/lib/firebase/server";
import { createFirebaseUserProvisioner } from "@/lib/firebase/user-provisioning";
import { isSystemAdministratorEmail, isSystemAdministratorProfileCode } from "@/lib/administration/c3-policy";
import {
  healthCatalogInputSchema,
  healthHabilitationInputSchema,
  healthHolidayInputSchema,
  healthProfessionalAdministrationInputSchema,
  healthProfessionalAssignmentInputSchema,
  healthSchedulingGroupInputSchema,
  healthServiceAssignmentInputSchema,
  healthSpecialtyGroupInputSchema,
  healthStatusChangeSchema,
  healthUnitAdministrationInputSchema,
  healthUnitShiftInputSchema,
  healthUnitSpecialtyInputSchema,
  healthUserAccessInputSchema,
  optionalHealthEntityIdSchema,
  type HealthCatalogInput,
  type HealthHabilitationInput,
  type HealthHolidayInput,
  type HealthProfessionalAdministrationInput,
  type HealthProfessionalAssignmentInput,
  type HealthSchedulingGroupInput,
  type HealthServiceAssignmentInput,
  type HealthSpecialtyGroupInput,
  type HealthUnitAdministrationInput,
  type HealthUnitShiftInput,
  type HealthUnitSpecialtyInput,
  type HealthUserAccessInput,
} from "@/lib/saude/admin-contract";

type ActionResult = { success: true } | { error: string };

function revalidateHealthAdministration() {
  for (const path of [
    "/app-domain/saude",
    "/app-domain/saude/administracao",
    "/app-domain/saude/unidades",
    "/app-domain/saude/profissionais",
    "/app-domain/saude/agenda",
    "/app-domain/saude/relatorios",
  ]) {
    revalidatePath(path);
  }
}

function hasErrorCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function actionError(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "Revise os campos informados.";
  if (error instanceof AccessError || error instanceof HealthOperationError) return error.message;
  if (hasErrorCode(error, "P2002")) return "Já existe um registro com essa identificação.";
  return fallback;
}

async function requireActiveUnit(prisma: Awaited<ReturnType<typeof getTenantContextForModuleOperation>>["prisma"], unitId: string) {
  const unit = await prisma.healthUnit.findFirst({ where: { id: unitId, isActive: true }, select: { id: true } });
  if (!unit) throw new HealthOperationError("A unidade selecionada deve estar ativa para receber vínculos administrativos.");
}

async function requireActiveProfessional(prisma: Awaited<ReturnType<typeof getTenantContextForModuleOperation>>["prisma"], professionalId: string) {
  const professional = await prisma.healthProfessional.findFirst({ where: { id: professionalId, isActive: true }, select: { id: true } });
  if (!professional) throw new HealthOperationError("O profissional selecionado deve estar ativo para receber vínculos administrativos.");
}

async function requireActiveSpecialty(prisma: Awaited<ReturnType<typeof getTenantContextForModuleOperation>>["prisma"], specialtyId: string) {
  const specialty = await prisma.healthSpecialty.findFirst({ where: { id: specialtyId, isActive: true }, select: { id: true, name: true } });
  if (!specialty) throw new HealthOperationError("A especialidade selecionada deve estar ativa.");
  return specialty;
}

async function requireActiveService(prisma: Awaited<ReturnType<typeof getTenantContextForModuleOperation>>["prisma"], serviceId: string) {
  const service = await prisma.healthService.findFirst({ where: { id: serviceId, isActive: true }, select: { id: true } });
  if (!service) throw new HealthOperationError("O serviço selecionado deve estar ativo.");
}

export async function saveHealthCbo(id: string | null, data: HealthCatalogInput): Promise<ActionResult> {
  try {
    const cboId = optionalHealthEntityIdSchema.parse(id);
    const input = healthCatalogInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", cboId ? "update" : "create");
    await context.prisma.$transaction(async tx => {
      const cbo = cboId
        ? await tx.healthCbo.update({ where: { id: cboId }, data: { code: input.code, description: input.name, isActive: input.isActive } })
        : await tx.healthCbo.create({ data: { code: input.code, description: input.name, isActive: input.isActive } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_CBO", targetId: cbo.id });
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar o CBO.") };
  }
}

export async function saveHealthSpecialty(id: string | null, data: HealthCatalogInput): Promise<ActionResult> {
  try {
    const specialtyId = optionalHealthEntityIdSchema.parse(id);
    const input = healthCatalogInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", specialtyId ? "update" : "create");
    await context.prisma.$transaction(async tx => {
      const specialty = specialtyId
        ? await tx.healthSpecialty.update({ where: { id: specialtyId }, data: { code: input.code, name: input.name, isActive: input.isActive } })
        : await tx.healthSpecialty.create({ data: { code: input.code, name: input.name, isActive: input.isActive } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_SPECIALTY", targetId: specialty.id });
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar a especialidade.") };
  }
}

export async function saveHealthService(id: string | null, data: HealthCatalogInput): Promise<ActionResult> {
  try {
    const serviceId = optionalHealthEntityIdSchema.parse(id);
    const input = healthCatalogInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", serviceId ? "update" : "create");
    await context.prisma.$transaction(async tx => {
      const service = serviceId
        ? await tx.healthService.update({ where: { id: serviceId }, data: { code: input.code, name: input.name, classification: input.classification, isActive: input.isActive } })
        : await tx.healthService.create({ data: { code: input.code, name: input.name, classification: input.classification, isActive: input.isActive } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_SERVICE", targetId: service.id });
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar o serviço SUS.") };
  }
}

export async function saveHealthSpecialtyGroup(id: string | null, data: HealthSpecialtyGroupInput): Promise<ActionResult> {
  try {
    const groupId = optionalHealthEntityIdSchema.parse(id);
    const input = healthSpecialtyGroupInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", groupId ? "update" : "create");
    await runHealthTransaction(context, async tx => {
      for (const specialtyId of input.specialtyIds) await requireActiveSpecialty(tx as typeof context.prisma, specialtyId);
      for (const serviceId of input.serviceIds) await requireActiveService(tx as typeof context.prisma, serviceId);
      const group = groupId
        ? await tx.healthSpecialtyGroup.update({ where: { id: groupId }, data: { name: input.name, isActive: input.isActive } })
        : await tx.healthSpecialtyGroup.create({ data: { name: input.name, isActive: input.isActive } });
      await tx.healthSpecialtyGroupMember.deleteMany({ where: { groupId: group.id } });
      await tx.healthSpecialtyGroupService.deleteMany({ where: { groupId: group.id } });
      if (input.specialtyIds.length) await tx.healthSpecialtyGroupMember.createMany({ data: input.specialtyIds.map(specialtyId => ({ groupId: group.id, specialtyId })) });
      if (input.serviceIds.length) await tx.healthSpecialtyGroupService.createMany({ data: input.serviceIds.map(serviceId => ({ groupId: group.id, serviceId })) });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_SPECIALTY_GROUP", targetId: group.id });
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar o grupo de especialidades.") };
  }
}

export async function saveHealthUnitAdministration(id: string | null, data: HealthUnitAdministrationInput): Promise<ActionResult> {
  try {
    const unitId = optionalHealthEntityIdSchema.parse(id);
    const input = healthUnitAdministrationInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", unitId ? "update" : "create");
    await context.prisma.$transaction(async tx => {
      const unit = unitId
        ? await tx.healthUnit.update({ where: { id: unitId }, data: input })
        : await tx.healthUnit.create({ data: { ...input, isActive: true } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_UNIT", targetId: unit.id });
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar a unidade de saúde.") };
  }
}

export async function changeHealthUnitStatus(data: { id: string; isActive: boolean; reason?: string | null }): Promise<ActionResult> {
  try {
    const input = healthStatusChangeSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    await runHealthTransaction(context, async tx => {
      const current = await tx.healthUnit.findUnique({ where: { id: input.id }, select: { id: true, isActive: true } });
      if (!current) throw new HealthOperationError("Unidade de saúde não encontrada.");
      if (current.isActive !== input.isActive) {
        await tx.healthUnit.update({
          where: { id: current.id },
          data: input.isActive
            ? { isActive: true, inactivatedAt: null, inactivationReason: null }
            : { isActive: false, inactivatedAt: new Date(), inactivationReason: input.reason },
        });
        await tx.healthRegistrationStatusHistory.create({ data: { unitId: current.id, isActive: input.isActive, reason: input.reason } });
        await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_UNIT_STATUS", targetId: current.id });
      }
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível alterar a situação da unidade.") };
  }
}

export async function saveHealthUnitShift(id: string | null, data: HealthUnitShiftInput): Promise<ActionResult> {
  try {
    const shiftId = optionalHealthEntityIdSchema.parse(id);
    const input = healthUnitShiftInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", shiftId ? "update" : "create");
    await context.prisma.$transaction(async tx => {
      await requireActiveUnit(tx as typeof context.prisma, input.unitId);
      const shift = shiftId
        ? await tx.healthUnitShift.update({ where: { id: shiftId }, data: input })
        : await tx.healthUnitShift.create({ data: input });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_UNIT_SHIFT", targetId: shift.id });
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar o turno de atendimento.") };
  }
}

export async function saveHealthUnitSpecialty(id: string | null, data: HealthUnitSpecialtyInput): Promise<ActionResult> {
  try {
    const linkId = optionalHealthEntityIdSchema.parse(id);
    const input = healthUnitSpecialtyInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", linkId ? "update" : "create");
    await context.prisma.$transaction(async tx => {
      await requireActiveUnit(tx as typeof context.prisma, input.unitId);
      await requireActiveSpecialty(tx as typeof context.prisma, input.specialtyId);
      const link = linkId
        ? await tx.healthUnitSpecialty.update({ where: { id: linkId }, data: input })
        : await tx.healthUnitSpecialty.upsert({ where: { unitId_specialtyId: { unitId: input.unitId, specialtyId: input.specialtyId } }, create: input, update: { isActive: input.isActive } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_UNIT_SPECIALTY", targetId: link.id });
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar a especialidade da unidade.") };
  }
}

export async function saveHealthServiceAssignment(id: string | null, data: HealthServiceAssignmentInput): Promise<ActionResult> {
  try {
    const assignmentId = optionalHealthEntityIdSchema.parse(id);
    const input = healthServiceAssignmentInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", assignmentId ? "update" : "create");
    await context.prisma.$transaction(async tx => {
      await requireActiveService(tx as typeof context.prisma, input.serviceId);
      if (input.unitId) await requireActiveUnit(tx as typeof context.prisma, input.unitId);
      if (input.professionalId) await requireActiveProfessional(tx as typeof context.prisma, input.professionalId);
      const assignment = assignmentId
        ? await tx.healthServiceAssignment.update({ where: { id: assignmentId }, data: input })
        : input.unitId
          ? await tx.healthServiceAssignment.upsert({ where: { serviceId_unitId: { serviceId: input.serviceId, unitId: input.unitId } }, create: input, update: { isActive: input.isActive } })
          : await tx.healthServiceAssignment.upsert({ where: { serviceId_professionalId: { serviceId: input.serviceId, professionalId: input.professionalId! } }, create: input, update: { isActive: input.isActive } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_SERVICE_ASSIGNMENT", targetId: assignment.id });
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar o vínculo de serviço.") };
  }
}

export async function saveHealthHabilitation(id: string | null, data: HealthHabilitationInput): Promise<ActionResult> {
  try {
    const habilitationId = optionalHealthEntityIdSchema.parse(id);
    const input = healthHabilitationInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", habilitationId ? "update" : "create");
    await context.prisma.$transaction(async tx => {
      if (input.unitId) await requireActiveUnit(tx as typeof context.prisma, input.unitId);
      if (input.professionalId) await requireActiveProfessional(tx as typeof context.prisma, input.professionalId);
      const habilitation = habilitationId
        ? await tx.healthHabilitation.update({ where: { id: habilitationId }, data: input })
        : input.unitId
          ? await tx.healthHabilitation.upsert({ where: { code_unitId: { code: input.code, unitId: input.unitId } }, create: input, update: { description: input.description, isActive: input.isActive } })
          : await tx.healthHabilitation.upsert({ where: { code_professionalId: { code: input.code, professionalId: input.professionalId! } }, create: input, update: { description: input.description, isActive: input.isActive } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_HABILITATION", targetId: habilitation.id });
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar a habilitação.") };
  }
}

export async function saveHealthProfessionalAdministration(id: string | null, data: HealthProfessionalAdministrationInput): Promise<ActionResult> {
  try {
    const professionalId = optionalHealthEntityIdSchema.parse(id);
    const input = healthProfessionalAdministrationInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", professionalId ? "update" : "create");
    await runHealthTransaction(context, async tx => {
      const employee = await tx.employee.findFirst({ where: { id: input.employeeId, isActive: true }, select: { id: true } });
      if (!employee) throw new HealthOperationError("Selecione um profissional vinculado a uma pessoa ativa.");
      if (input.cbo) {
        const cbo = await tx.healthCbo.findFirst({ where: { code: input.cbo, isActive: true }, select: { id: true } });
        if (!cbo) throw new HealthOperationError("Selecione um CBO ativo cadastrado na referência de saúde.");
      }
      const specialty = input.specialtyId ? await requireActiveSpecialty(tx as typeof context.prisma, input.specialtyId) : null;
      if (input.unitId) await requireActiveUnit(tx as typeof context.prisma, input.unitId);
      if (input.cns) {
        const duplicateCns = await tx.healthProfessional.findFirst({ where: { cns: input.cns, ...(professionalId ? { NOT: { id: professionalId } } : {}) }, select: { id: true } });
        if (duplicateCns) throw new HealthOperationError("Já existe um profissional de saúde com este CNS.");
      }
      if (!professionalId) {
        const duplicateEmployee = await tx.healthProfessional.findUnique({ where: { employeeId: input.employeeId }, select: { id: true } });
        if (duplicateEmployee) throw new HealthOperationError("Este profissional já possui cadastro de saúde.");
      }
      const dataToSave = {
        cns: input.cns,
        treatment: input.treatment,
        cbo: input.cbo,
        councilName: input.councilName,
        councilNumber: input.councilNumber,
        specialty: specialty?.name || null,
        isAuditor: input.isAuditor,
        consultationIntervalMinutes: input.consultationIntervalMinutes,
        unitId: input.unitId,
      };
      const professional = professionalId
        ? await tx.healthProfessional.update({ where: { id: professionalId }, data: dataToSave })
        : await tx.healthProfessional.create({ data: { employeeId: input.employeeId, ...dataToSave, isActive: true } });
      if (input.unitId) {
        if (input.specialtyId) {
          await tx.healthProfessionalAssignment.upsert({
            where: { professionalId_unitId_specialtyId: { professionalId: professional.id, unitId: input.unitId, specialtyId: input.specialtyId } },
            create: { professionalId: professional.id, unitId: input.unitId, specialtyId: input.specialtyId, weeklyHours: input.weeklyHours, isActive: true },
            update: { weeklyHours: input.weeklyHours, isActive: true },
          });
        } else {
          const existingAssignment = await tx.healthProfessionalAssignment.findFirst({ where: { professionalId: professional.id, unitId: input.unitId, specialtyId: null }, select: { id: true } });
          if (existingAssignment) {
            await tx.healthProfessionalAssignment.update({ where: { id: existingAssignment.id }, data: { weeklyHours: input.weeklyHours, isActive: true } });
          } else {
            await tx.healthProfessionalAssignment.create({ data: { professionalId: professional.id, unitId: input.unitId, specialtyId: null, weeklyHours: input.weeklyHours, isActive: true } });
          }
        }
      }
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_PROFESSIONAL", targetId: professional.id });
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar o profissional de saúde.") };
  }
}

export async function changeHealthProfessionalStatus(data: { id: string; isActive: boolean; reason?: string | null }): Promise<ActionResult> {
  try {
    const input = healthStatusChangeSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    await runHealthTransaction(context, async tx => {
      const current = await tx.healthProfessional.findUnique({ where: { id: input.id }, select: { id: true, isActive: true, employee: { select: { isActive: true } } } });
      if (!current) throw new HealthOperationError("Profissional de saúde não encontrado.");
      if (input.isActive && !current.employee.isActive) throw new HealthOperationError("Não é possível ativar um profissional vinculado a uma pessoa inativa.");
      if (!input.isActive && current.isActive) {
        const pendingAppointment = await tx.healthAppointment.findFirst({ where: { professionalId: current.id, status: { notIn: ["Atendido", "Faltou", "Cancelado"] } }, select: { id: true } });
        if (pendingAppointment) throw new HealthOperationError("Não é possível inativar este profissional enquanto houver agendamentos pendentes.");
      }
      if (current.isActive !== input.isActive) {
        await tx.healthProfessional.update({
          where: { id: current.id },
          data: input.isActive
            ? { isActive: true, inactivatedAt: null, inactivationReason: null }
            : { isActive: false, inactivatedAt: new Date(), inactivationReason: input.reason },
        });
        await tx.healthRegistrationStatusHistory.create({ data: { professionalId: current.id, isActive: input.isActive, reason: input.reason } });
        await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_PROFESSIONAL_STATUS", targetId: current.id });
      }
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível alterar a situação do profissional.") };
  }
}

export async function saveHealthProfessionalAssignment(id: string | null, data: HealthProfessionalAssignmentInput): Promise<ActionResult> {
  try {
    const assignmentId = optionalHealthEntityIdSchema.parse(id);
    const input = healthProfessionalAssignmentInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", assignmentId ? "update" : "create");
    await context.prisma.$transaction(async tx => {
      await requireActiveProfessional(tx as typeof context.prisma, input.professionalId);
      await requireActiveUnit(tx as typeof context.prisma, input.unitId);
      if (input.specialtyId) await requireActiveSpecialty(tx as typeof context.prisma, input.specialtyId);
      let assignment;
      if (assignmentId) {
        assignment = await tx.healthProfessionalAssignment.update({ where: { id: assignmentId }, data: input });
      } else if (input.specialtyId) {
        assignment = await tx.healthProfessionalAssignment.upsert({
          where: { professionalId_unitId_specialtyId: { professionalId: input.professionalId, unitId: input.unitId, specialtyId: input.specialtyId } },
          create: input,
          update: { weeklyHours: input.weeklyHours, isActive: input.isActive },
        });
      } else {
        const existingAssignment = await tx.healthProfessionalAssignment.findFirst({ where: { professionalId: input.professionalId, unitId: input.unitId, specialtyId: null }, select: { id: true } });
        assignment = existingAssignment
          ? await tx.healthProfessionalAssignment.update({ where: { id: existingAssignment.id }, data: input })
          : await tx.healthProfessionalAssignment.create({ data: input });
      }
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_PROFESSIONAL_ASSIGNMENT", targetId: assignment.id });
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar o vínculo do profissional.") };
  }
}

export async function saveHealthSchedulingGroup(id: string | null, data: HealthSchedulingGroupInput): Promise<ActionResult> {
  try {
    const schedulingGroupId = optionalHealthEntityIdSchema.parse(id);
    const input = healthSchedulingGroupInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", schedulingGroupId ? "update" : "create");
    await context.prisma.$transaction(async tx => {
      await requireActiveUnit(tx as typeof context.prisma, input.unitId);
      const specialtyGroup = await tx.healthSpecialtyGroup.findFirst({ where: { id: input.specialtyGroupId, isActive: true }, select: { id: true } });
      if (!specialtyGroup) throw new HealthOperationError("O grupo de especialidades selecionado deve estar ativo.");
      const group = schedulingGroupId
        ? await tx.healthSchedulingGroup.update({ where: { id: schedulingGroupId }, data: input })
        : await tx.healthSchedulingGroup.create({ data: input });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_SCHEDULING_GROUP", targetId: group.id });
    });
    revalidateHealthAdministration();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar o grupo de agendamento.") };
  }
}

export async function saveHealthHoliday(id: string | null, data: HealthHolidayInput): Promise<ActionResult> {
  try {
    const holidayId = optionalHealthEntityIdSchema.parse(id);
    const input = healthHolidayInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", holidayId ? "update" : "create");
    const date = new Date(`${input.date}T12:00:00.000Z`);
    await context.prisma.$transaction(async tx => {
      const holiday = holidayId
        ? await tx.calendarEvent.update({ where: { id: holidayId }, data: { title: input.title, description: input.description, date, type: input.type, isHoliday: true } })
        : await tx.calendarEvent.create({ data: { title: input.title, description: input.description, date, type: input.type, isHoliday: true } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_HOLIDAY", targetId: holiday.id });
    });
    revalidateHealthAdministration();
    revalidatePath("/app-domain/administracao/calendario");
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar o feriado.") };
  }
}

export async function saveHealthUserAccess(data: HealthUserAccessInput): Promise<ActionResult> {
  try {
    const input = healthUserAccessInputSchema.parse(data);
    const context = await getTenantContextForSystemAdministration();
    const { prisma } = context;
    const [user, profile, employee, healthModule, units] = await Promise.all([
      prisma.usuario.findUnique({ where: { id: input.usuarioId }, select: { id: true, email: true, nome: true, firebaseUid: true, perfil: { select: { codigo: true } } } }),
      prisma.configuracaoPerfil.findFirst({ where: { id: input.perfilId, ativo: true }, select: { id: true, codigo: true } }),
      prisma.employee.findFirst({
        where: { id: input.employeeId, isActive: true },
        select: {
          id: true,
          usuario: { select: { id: true } },
          person: { select: { id: true, status: true, fullName: true, cpf: true, birthDate: true, gender: true, raceColor: true, motherName: true, addresses: { take: 1, select: { id: true } } } },
        },
      }),
      prisma.configuracaoModulo.findUnique({ where: { codigo: "SAUDE" }, select: { id: true, ativo: true } }),
      prisma.healthUnit.findMany({ where: { id: { in: input.unitIds }, isActive: true }, select: { id: true } }),
    ]);
    if (!user) throw new HealthOperationError("Usuário não encontrado.");
    if (!profile) throw new HealthOperationError("Selecione um perfil de acesso ativo.");
    if (isSystemAdministratorEmail(user.email) || isSystemAdministratorProfileCode(user.perfil.codigo) || isSystemAdministratorProfileCode(profile.codigo)) throw new HealthOperationError("A conta técnica do administrador do sistema não pode ser alterada nesta rotina.");
    if (!employee?.person || employee.person.status !== "Ativo") throw new HealthOperationError("Selecione um servidor vinculado a uma pessoa física ativa.");
    if (employee.usuario && employee.usuario.id !== user.id) throw new HealthOperationError("Esta pessoa já está vinculada a outro usuário.");
    if (!employee.person.fullName || !employee.person.cpf || !employee.person.birthDate || !employee.person.gender || !employee.person.raceColor || !employee.person.motherName || !employee.person.addresses.length) {
      throw new HealthOperationError("Complete nome, CPF, sexo, raça/cor, nascimento, nome da mãe e endereço residencial da pessoa antes de liberar o acesso à Saúde.");
    }
    if (!healthModule?.ativo) throw new HealthOperationError("O módulo Saúde deve estar ativo para conceder acesso.");
    if (units.length !== input.unitIds.length) throw new HealthOperationError("Uma ou mais unidades selecionadas não estão ativas.");

    const provisioner = createFirebaseUserProvisioner(adminAuth);
    const { firebaseUid } = await provisioner.provision({
      email: user.email,
      displayName: user.nome,
      disabled: !input.ativo,
      firebaseUid: user.firebaseUid,
    });
    const weekdays = [...input.weekdays].sort().join(",");
    await prisma.$transaction(async tx => {
      await tx.usuario.update({ where: { id: user.id }, data: { perfilId: input.perfilId, employeeId: employee.id, ativo: input.ativo, firebaseUid } });
      await tx.usuarioModulo.upsert({
        where: { usuarioId_moduloId: { usuarioId: user.id, moduloId: healthModule.id } },
        create: { usuarioId: user.id, moduloId: healthModule.id, canView: input.canView, canEdit: input.canEdit },
        update: { canView: input.canView, canEdit: input.canEdit },
      });
      await tx.healthUserAccessScope.deleteMany({ where: { usuarioId: user.id, unitId: { notIn: input.unitIds } } });
      for (const unitId of input.unitIds) {
        await tx.healthUserAccessScope.upsert({
          where: { usuarioId_unitId: { usuarioId: user.id, unitId } },
          create: { usuarioId: user.id, unitId, validFrom: input.validFrom, validUntil: input.validUntil, weekdays, startTime: input.startTime, endTime: input.endTime, isActive: true },
          update: { validFrom: input.validFrom, validUntil: input.validUntil, weekdays, startTime: input.startTime, endTime: input.endTime, isActive: true },
        });
      }
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_USER_ACCESS", targetId: user.id });
    });
    revalidateHealthAdministration();
    revalidatePath("/app-domain/configuracoes/usuarios");
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Não foi possível salvar o acesso do usuário à Saúde.") };
  }
}
