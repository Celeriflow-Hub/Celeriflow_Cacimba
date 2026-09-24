"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { HealthOperationError, runHealthTransaction } from "@/lib/saude/appointment-service";
import { healthEntityIdSchema, healthProfessionalInputSchema, type HealthProfessionalInput } from "@/lib/saude/contract";

function revalidateHealthProfessionals() {
  for (const path of ["/app-domain/saude", "/app-domain/saude/profissionais", "/app-domain/saude/agenda", "/app-domain/saude/atendimentos"]) {
    revalidatePath(path);
  }
}

function hasErrorCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function actionError(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "Revise os campos informados.";
  if (error instanceof AccessError || error instanceof HealthOperationError) return error.message;
  if (hasErrorCode(error, "P2002")) return "Este servidor ja esta cadastrado como profissional de saude.";
  return fallback;
}

export async function createHealthProfessional(data: HealthProfessionalInput) {
  try {
    const input = healthProfessionalInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", "create");
    await context.prisma.$transaction(async tx => {
      const employee = await tx.employee.findFirst({ where: { id: input.employeeId, isActive: true }, select: { id: true } });
      if (!employee) throw new HealthOperationError("Selecione um servidor ativo do RH.");
      const existing = await tx.healthProfessional.findUnique({ where: { employeeId: input.employeeId }, select: { id: true } });
      if (existing) throw new HealthOperationError("Este servidor ja esta cadastrado como profissional de saude.");
      const professional = await tx.healthProfessional.create({
        data: {
          employeeId: input.employeeId,
          specialty: input.specialty,
          councilName: input.councilType,
          councilNumber: input.councilNumber,
          isActive: true,
        },
      });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_PROFESSIONAL", targetId: professional.id });
    });
    revalidateHealthProfessionals();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Nao foi possivel criar o profissional de saude. Os dados foram preservados.") };
  }
}

export async function updateHealthProfessional(id: string, data: HealthProfessionalInput) {
  try {
    const professionalId = healthEntityIdSchema.parse(id);
    const input = healthProfessionalInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    await context.prisma.$transaction(async tx => {
      const professional = await tx.healthProfessional.update({
        where: { id: professionalId },
        data: {
          specialty: input.specialty,
          councilName: input.councilType,
          councilNumber: input.councilNumber,
        },
      });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_PROFESSIONAL", targetId: professional.id });
    });
    revalidateHealthProfessionals();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Nao foi possivel atualizar o profissional de saude. Os dados foram preservados.") };
  }
}

export async function toggleHealthProfessionalStatus(id: string, isActive: boolean) {
  try {
    const input = z.object({ id: healthEntityIdSchema, isActive: z.boolean() }).parse({ id, isActive });
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    await runHealthTransaction(context, async tx => {
      const professional = await tx.healthProfessional.findUnique({
        where: { id: input.id },
        select: { id: true, isActive: true, employee: { select: { isActive: true } } },
      });
      if (!professional) throw new HealthOperationError("Profissional de saude nao encontrado.");
      if (input.isActive && !professional.employee.isActive) {
        throw new HealthOperationError("Nao e possivel ativar um profissional vinculado a um servidor inativo do RH.");
      }
      if (!input.isActive && professional.isActive) {
        const pendingAppointment = await tx.healthAppointment.findFirst({
          where: { professionalId: professional.id, status: { notIn: ["Atendido", "Faltou", "Cancelado"] } },
          select: { id: true },
        });
        if (pendingAppointment) {
          throw new HealthOperationError("Nao e possivel inativar este profissional enquanto houver agendamentos pendentes vinculados a ele.");
        }
      }
      const updated = await tx.healthProfessional.update({ where: { id: professional.id }, data: { isActive: input.isActive } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_PROFESSIONAL", targetId: updated.id });
    });
    revalidateHealthProfessionals();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Nao foi possivel alterar o status do profissional.") };
  }
}

export async function deleteHealthProfessional(id: string) {
  try {
    const professionalId = healthEntityIdSchema.parse(id);
    const context = await getTenantContextForModuleOperation("SAUDE", "delete");
    await runHealthTransaction(context, async tx => {
      const dependencies = await Promise.all([
        tx.healthAppointment.count({ where: { professionalId } }),
        tx.medicalRecord.count({ where: { professionalId } }),
        tx.healthPrescription.count({ where: { professionalId } }),
        tx.vaccinationRecord.count({ where: { professionalId } }),
        tx.healthExamRequest.count({ where: { professionalId } }),
        tx.healthReferral.count({ where: { professionalId } }),
      ]);
      if (dependencies.some(Boolean)) {
        throw new HealthOperationError("Nao e possivel excluir este profissional pois ele possui prontuarios, agendamentos ou outros vinculos.");
      }
      await tx.healthProfessional.delete({ where: { id: professionalId } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_PROFESSIONAL", targetId: professionalId });
    });
    revalidateHealthProfessionals();
    return { success: true };
  } catch (error) {
    if (hasErrorCode(error, "P2003")) return { error: "Nao e possivel excluir este profissional pois ele possui prontuarios, agendamentos ou outros vinculos." };
    return { error: actionError(error, "Nao foi possivel excluir este profissional.") };
  }
}
