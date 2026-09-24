import { z } from "zod";
import type { Prisma } from "@prisma/client";
import type { AppContext } from "@/lib/platform/tenant-context";
import { assertHealthUnitAccess } from "@/lib/platform/tenant-context";
import { applyStockMovement } from "@/lib/patrimonio/stock-service";

export class SpecializedCareError extends Error {}

export async function saveSpecializedCatalogItem(context: AppContext, input: { category: string; code: string; name: string; referenceValue?: number | null; materialId?: string | null }) {
  const category = input.category.trim().toUpperCase();
  const code = input.code.trim().toUpperCase();
  const name = input.name.trim();
  if (!category || !code || name.length < 2 || (input.referenceValue !== null && input.referenceValue !== undefined && input.referenceValue < 0)) throw new SpecializedCareError("Informe categoria, código, nome e valor de referência válidos.");
  return context.prisma.specializedCatalogItem.upsert({ where: { category_code: { category, code } }, create: { category, code, name, referenceValue: input.referenceValue, materialId: input.materialId }, update: { name, referenceValue: input.referenceValue, materialId: input.materialId, isActive: true }, select: { id: true } });
}

const planSchema = z.object({ patientId: z.string().min(1), unitId: z.string().min(1), teamId: z.string().min(1), initialMedicalRecordId: z.string().min(1).nullable().optional(), goals: z.string().trim().min(3).max(4000), carePlan: z.string().trim().min(3).max(4000), plannedConsultations: z.number().int().positive().max(999) }).strict();
const entrySchema = z.object({ planId: z.string().min(1), specialtyId: z.string().min(1).nullable().optional(), healthServiceId: z.string().min(1).nullable().optional(), medicalRecordId: z.string().min(1).nullable().optional(), kind: z.enum(["OPINION", "EVOLUTION", "INTERCONSULTATION", "OUTCOME"]), content: z.string().trim().min(3).max(8000), diagnosisSummary: z.string().trim().max(2000).nullable().optional(), weight: z.number().positive().max(700).nullable().optional(), height: z.number().positive().max(3).nullable().optional() }).strict();
const distributionSchema = z.object({ planId: z.string().min(1), quotaId: z.string().min(1).nullable().optional(), warehouseId: z.string().min(1), materialId: z.string().min(1), batchNumber: z.string().trim().min(1), quantity: z.number().positive(), notes: z.string().trim().max(500).nullable().optional() }).strict();

export async function saveSpecializedSchedule(context: AppContext, input: { teamId: string; unitId: string; month: string; patientCapacity: number }) {
  if (!/^\d{4}-\d{2}$/.test(input.month) || !Number.isInteger(input.patientCapacity) || input.patientCapacity <= 0) throw new SpecializedCareError("Informe competência e capacidade válidas.");
  assertHealthUnitAccess(context.user, input.unitId);
  const team = await context.prisma.healthTeam.findFirst({ where: { id: input.teamId, unitId: input.unitId, isActive: true }, select: { id: true } });
  if (!team) throw new SpecializedCareError("Equipe ativa não encontrada na unidade.");
  return context.prisma.specializedTeamSchedule.upsert({ where: { teamId_unitId_month: { teamId: input.teamId, unitId: input.unitId, month: input.month } }, create: input, update: { patientCapacity: input.patientCapacity }, select: { id: true } });
}

export async function saveSpecializedQuota(context: AppContext, input: { patientId: string; materialId: string; period: string; allowedQuantity: number }) {
  if (!/^\d{4}-\d{2}$/.test(input.period) || !Number.isFinite(input.allowedQuantity) || input.allowedQuantity <= 0) throw new SpecializedCareError("Informe período e quantidade da cota.");
  const patient = await context.prisma.patient.findUnique({ where: { id: input.patientId }, select: { referenceUnitId: true } });
  if (!patient) throw new SpecializedCareError("Paciente não encontrado.");
  assertHealthUnitAccess(context.user, patient.referenceUnitId || "");
  return context.prisma.specializedQuota.upsert({ where: { patientId_materialId_period: { patientId: input.patientId, materialId: input.materialId, period: input.period } }, create: input, update: { allowedQuantity: input.allowedQuantity }, select: { id: true } });
}

async function teamProfessional(context: AppContext, teamId: string) {
  if (!context.user.employeeId) throw new SpecializedCareError("Vincule o usuário autenticado a um profissional de saúde.");
  const professional = await context.prisma.healthProfessional.findFirst({ where: { employeeId: context.user.employeeId, isActive: true, teamId }, select: { id: true } });
  if (!professional) throw new SpecializedCareError("O profissional não pertence à equipe multidisciplinar deste plano.");
  return professional;
}

export async function createSpecializedPlan(context: AppContext, raw: unknown) {
  const input = planSchema.parse(raw);
  assertHealthUnitAccess(context.user, input.unitId);
  await teamProfessional(context, input.teamId);
  return context.prisma.$transaction(async (tx) => {
    const [patient, team, record] = await Promise.all([
      tx.patient.findFirst({ where: { id: input.patientId, status: "Ativo" }, select: { id: true } }),
      tx.healthTeam.findFirst({ where: { id: input.teamId, unitId: input.unitId, isActive: true }, select: { id: true } }),
      input.initialMedicalRecordId ? tx.medicalRecord.findFirst({ where: { id: input.initialMedicalRecordId, patientId: input.patientId, unitId: input.unitId }, select: { id: true } }) : null,
    ]);
    if (!patient || !team || (input.initialMedicalRecordId && !record)) throw new SpecializedCareError("Paciente, equipe ou prontuário de origem inválido.");
    const month = new Date().toISOString().slice(0, 7);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${team.id}:${input.unitId}:${month}`}))`;
    const schedule = await tx.specializedTeamSchedule.findUnique({ where: { teamId_unitId_month: { teamId: team.id, unitId: input.unitId, month } } });
    if (schedule) {
      const activePlans = await tx.specializedTherapeuticPlan.count({ where: { teamId: team.id, unitId: input.unitId, status: { not: "CANCELLED" }, startedAt: { gte: new Date(`${month}-01T00:00:00.000Z`) } } });
      if (activePlans >= schedule.patientCapacity) throw new SpecializedCareError("A capacidade mensal configurada para a equipe foi atingida.");
    }
    return tx.specializedTherapeuticPlan.create({ data: { ...input, createdByUsuarioId: context.user.id }, select: { id: true, status: true } });
  });
}

export async function addSpecializedPlanEntry(context: AppContext, raw: unknown) {
  const input = entrySchema.parse(raw);
  const plan = await context.prisma.specializedTherapeuticPlan.findUnique({ where: { id: input.planId }, select: { id: true, patientId: true, status: true, teamId: true, unitId: true } });
  if (!plan || plan.status !== "ACTIVE") throw new SpecializedCareError("Plano terapêutico ativo não encontrado.");
  assertHealthUnitAccess(context.user, plan.unitId);
  const professional = await teamProfessional(context, plan.teamId);
  const bmi = input.weight && input.height ? Number((input.weight / (input.height * input.height)).toFixed(2)) : null;
  return context.prisma.$transaction(async (tx) => {
    const [specialty, service, record] = await Promise.all([
      input.specialtyId ? tx.healthSpecialty.findFirst({ where: { id: input.specialtyId, isActive: true }, select: { id: true } }) : null,
      input.healthServiceId ? tx.healthService.findFirst({ where: { id: input.healthServiceId, isActive: true }, select: { id: true } }) : null,
      input.medicalRecordId ? tx.medicalRecord.findFirst({ where: { id: input.medicalRecordId, patientId: plan.patientId, unitId: plan.unitId }, select: { id: true } }) : null,
    ]);
    if ((input.specialtyId && !specialty) || (input.healthServiceId && !service) || (input.medicalRecordId && !record)) throw new SpecializedCareError("Especialidade, serviço ou prontuário incompatível com o plano.");
    const entry = await tx.specializedPlanEntry.create({ data: { ...input, professionalId: professional.id, bmi }, select: { id: true } });
    if (input.kind === "EVOLUTION") await tx.specializedTherapeuticPlan.update({ where: { id: plan.id }, data: { completedConsultations: { increment: 1 } } });
    return entry;
  });
}

export async function distributeSpecializedMaterial(context: AppContext, raw: unknown) {
  const input = distributionSchema.parse(raw);
  return context.prisma.$transaction(async (tx) => {
    const plan = await tx.specializedTherapeuticPlan.findUnique({ where: { id: input.planId }, select: { id: true, patientId: true, unitId: true, teamId: true, status: true } });
    if (!plan || plan.status !== "ACTIVE") throw new SpecializedCareError("Plano terapêutico ativo não encontrado.");
    assertHealthUnitAccess(context.user, plan.unitId);
    if (!context.user.employeeId || !await tx.healthProfessional.findFirst({ where: { employeeId: context.user.employeeId, isActive: true, teamId: plan.teamId }, select: { id: true } })) throw new SpecializedCareError("O profissional não pertence à equipe multidisciplinar deste plano.");
    const stock = await tx.materialStock.findUnique({ where: { warehouseId_materialId_batchNumber: { warehouseId: input.warehouseId, materialId: input.materialId, batchNumber: input.batchNumber } }, select: { id: true, unitCost: true, blockedAt: true, expirationDate: true, warehouse: { select: { healthUnitId: true } } } });
    if (!stock || stock.warehouse.healthUnitId !== plan.unitId || stock.blockedAt || (stock.expirationDate && stock.expirationDate < new Date())) throw new SpecializedCareError("Lote indisponível para a unidade do plano.");
    if (input.quotaId) {
      const quota = await tx.specializedQuota.updateMany({ where: { id: input.quotaId, patientId: plan.patientId, materialId: input.materialId, consumedQuantity: { lte: await remainingQuotaLimit(tx, input.quotaId, input.quantity) } }, data: { consumedQuantity: { increment: input.quantity } } });
      if (quota.count !== 1) throw new SpecializedCareError("A entrega ultrapassa a cota disponível do paciente.");
    }
    const { movement } = await applyStockMovement(tx, { kind: "EXIT", warehouseId: input.warehouseId, materialId: input.materialId, batchNumber: input.batchNumber, quantity: input.quantity, reason: `DISTRIBUICAO_PLANO:${plan.id}`, actor: { usuarioId: context.user.id, employeeId: context.user.employeeId } });
    return tx.specializedDistribution.create({ data: { planId: plan.id, quotaId: input.quotaId, patientId: plan.patientId, warehouseId: input.warehouseId, materialId: input.materialId, stockId: stock.id, movementId: movement.id, quantity: input.quantity, referenceValue: stock.unitCost, deliveredByUsuarioId: context.user.id, notes: input.notes }, select: { id: true } });
  });
}

async function remainingQuotaLimit(tx: Prisma.TransactionClient, quotaId: string, requested: number) {
  const quota = await tx.specializedQuota.findUnique({ where: { id: quotaId }, select: { allowedQuantity: true } });
  if (!quota) return -1;
  return quota.allowedQuantity - requested;
}
