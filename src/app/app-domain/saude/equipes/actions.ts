"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { HealthOperationError, runHealthTransaction } from "@/lib/saude/appointment-service";
import { healthEntityIdSchema, healthTeamInputSchema, type HealthTeamInput } from "@/lib/saude/contract";

function revalidateHealthTeams() {
  for (const path of ["/app-domain/saude", "/app-domain/saude/equipes", "/app-domain/saude/pacientes", "/app-domain/saude/agenda"]) {
    revalidatePath(path);
  }
}

function hasErrorCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

function actionError(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "Revise os campos informados.";
  if (error instanceof AccessError || error instanceof HealthOperationError) return error.message;
  if (hasErrorCode(error, "P2002")) return "Ja existe uma equipe cadastrada com este codigo.";
  return fallback;
}

async function requireActiveUnit(tx: Prisma.TransactionClient, unitId: string) {
  const unit = await tx.healthUnit.findFirst({ where: { id: unitId, isActive: true }, select: { id: true } });
  if (!unit) throw new HealthOperationError("Selecione uma unidade de saude ativa.");
}

export async function createHealthTeam(data: HealthTeamInput) {
  try {
    const input = healthTeamInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", "create");
    await runHealthTransaction(context, async tx => {
      await requireActiveUnit(tx, input.unitId);
      const team = await tx.healthTeam.create({ data: { ...input, isActive: true } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_TEAM", targetId: team.id });
    });
    revalidateHealthTeams();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Nao foi possivel criar a equipe. Os dados foram preservados.") };
  }
}

export async function updateHealthTeam(id: string, data: HealthTeamInput) {
  try {
    const teamId = healthEntityIdSchema.parse(id);
    const input = healthTeamInputSchema.parse(data);
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    await runHealthTransaction(context, async tx => {
      await requireActiveUnit(tx, input.unitId);
      const current = await tx.healthTeam.findUnique({ where: { id: teamId }, select: { id: true, unitId: true } });
      if (!current) throw new HealthOperationError("Equipe nao encontrada.");
      if (current.unitId !== input.unitId) {
        const [patients, professionals] = await Promise.all([
          tx.patient.count({ where: { teamId } }),
          tx.healthProfessional.count({ where: { teamId } }),
        ]);
        if (patients || professionals) {
          throw new HealthOperationError("Uma equipe com pacientes ou profissionais vinculados nao pode mudar de unidade.");
        }
      }
      const team = await tx.healthTeam.update({ where: { id: teamId }, data: input });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_TEAM", targetId: team.id });
    });
    revalidateHealthTeams();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Nao foi possivel atualizar a equipe. Os dados foram preservados.") };
  }
}

export async function toggleHealthTeamStatus(id: string, isActive: boolean) {
  try {
    const input = z.object({ id: healthEntityIdSchema, isActive: z.boolean() }).parse({ id, isActive });
    const context = await getTenantContextForModuleOperation("SAUDE", "update");
    await context.prisma.$transaction(async tx => {
      const team = await tx.healthTeam.update({ where: { id: input.id }, data: { isActive: input.isActive } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_TEAM", targetId: team.id });
    });
    revalidateHealthTeams();
    return { success: true };
  } catch (error) {
    return { error: actionError(error, "Nao foi possivel alterar o status da equipe.") };
  }
}

export async function deleteHealthTeam(id: string) {
  try {
    const teamId = healthEntityIdSchema.parse(id);
    const context = await getTenantContextForModuleOperation("SAUDE", "delete");
    await runHealthTransaction(context, async tx => {
      const [patients, professionals] = await Promise.all([
        tx.patient.count({ where: { teamId } }),
        tx.healthProfessional.count({ where: { teamId } }),
      ]);
      if (patients || professionals) {
        throw new HealthOperationError("Nao e possivel excluir esta equipe pois ela possui pacientes ou profissionais vinculados.");
      }
      await tx.healthTeam.delete({ where: { id: teamId } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "HEALTH_TEAM", targetId: teamId });
    });
    revalidateHealthTeams();
    return { success: true };
  } catch (error) {
    if (hasErrorCode(error, "P2003")) return { error: "Nao e possivel excluir esta equipe pois ela possui vinculos." };
    return { error: actionError(error, "Nao foi possivel excluir esta equipe.") };
  }
}
