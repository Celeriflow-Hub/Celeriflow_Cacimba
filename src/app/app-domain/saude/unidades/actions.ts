"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { HealthOperationError, runHealthTransaction } from "@/lib/saude/appointment-service";
import { healthEntityIdSchema, healthUnitInputSchema, type HealthUnitInput } from "@/lib/saude/contract";

function revalidateHealthUnits() {
  for (const path of ["/app-domain/saude", "/app-domain/saude/unidades", "/app-domain/saude/equipes", "/app-domain/saude/pacientes", "/app-domain/saude/agenda"]) {
    revalidatePath(path);
  }
}

function hasErrorCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function actionError(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "Revise os campos informados.";
  if (error instanceof AccessError || error instanceof HealthOperationError) return error.message;
  if (hasErrorCode(error, "P2002")) return "Ja existe uma unidade cadastrada com este CNES.";
  return fallback;
}

export async function createHealthUnit(data: HealthUnitInput) {
  try {
    const input = healthUnitInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", "create");
    await context.prisma.$transaction(async tx => {
      const unit = await tx.healthUnit.create({
        data: { ...input, isActive: true },
      });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_UNIT", targetId: unit.id });
    });
    revalidateHealthUnits();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Nao foi possivel criar a unidade de saude. Os dados foram preservados.") };
  }
}

export async function updateHealthUnit(id: string, data: HealthUnitInput) {
  try {
    const unitId = healthEntityIdSchema.parse(id);
    const input = healthUnitInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    await context.prisma.$transaction(async tx => {
      const updated = await tx.healthUnit.update({ where: { id: unitId }, data: input });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_UNIT", targetId: updated.id });
    });
    revalidateHealthUnits();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Nao foi possivel atualizar a unidade de saude. Os dados foram preservados.") };
  }
}

export async function toggleHealthUnitStatus(id: string, isActive: boolean) {
  try {
    const input = z.object({ id: healthEntityIdSchema, isActive: z.boolean() }).parse({ id, isActive });
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    await context.prisma.$transaction(async tx => {
      const updated = await tx.healthUnit.update({ where: { id: input.id }, data: { isActive: input.isActive } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_UNIT", targetId: updated.id });
    });
    revalidateHealthUnits();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Nao foi possivel alterar o status da unidade.") };
  }
}

export async function deleteHealthUnit(id: string) {
  try {
    const unitId = healthEntityIdSchema.parse(id);
    const context = await getTenantContextForModuleOperation("SAUDE", "delete");
    await runHealthTransaction(context, async tx => {
      const dependencies = await Promise.all([
        tx.healthTeam.count({ where: { unitId } }),
        tx.healthProfessional.count({ where: { unitId } }),
        tx.patient.count({ where: { referenceUnitId: unitId } }),
        tx.healthAppointment.count({ where: { unitId } }),
        tx.medicalRecord.count({ where: { unitId } }),
        tx.medicineDispensation.count({ where: { unitId } }),
        tx.vaccinationRecord.count({ where: { unitId } }),
      ]);
      if (dependencies.some(Boolean)) {
        throw new HealthOperationError("Nao e possivel excluir esta unidade pois ela possui vinculos no sistema.");
      }
      await tx.healthUnit.delete({ where: { id: unitId } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_UNIT", targetId: unitId });
    });
    revalidateHealthUnits();
    return { success: true };
  } catch (error) {
    if (hasErrorCode(error, "P2003")) return { error: "Nao e possivel excluir esta unidade pois ela possui vinculos no sistema." };
    return { error: actionError(error, "Nao foi possivel excluir esta unidade.") };
  }
}
