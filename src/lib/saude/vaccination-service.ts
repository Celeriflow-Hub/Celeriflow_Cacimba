import { z } from "zod";
import type { AppContext } from "@/lib/platform/tenant-context";
import { assertHealthUnitAccess } from "@/lib/platform/tenant-context";
import { applyStockMovement } from "@/lib/patrimonio/stock-service";
import { HealthStockError } from "./health-stock-service";

const vaccinationSchema = z.object({
  vaccineId: z.string().min(1),
  patientId: z.string().min(1),
  warehouseId: z.string().min(1),
  batchNumber: z.string().trim().min(1).max(80),
  doseNumber: z.number().int().positive(),
  quantity: z.number().positive().default(1),
  citizenCondition: z.enum(["NONE", "PREGNANT", "POSTPARTUM", "TRAVELER"]).default("NONE"),
  strategy: z.string().trim().min(1).max(100),
  applicationSite: z.string().trim().min(1).max(100),
  applicationReason: z.string().trim().min(1).max(100),
  administrationRoute: z.string().trim().min(1).max(100),
  shift: z.string().trim().min(1).max(40),
  idempotencyKey: z.string().trim().min(8).max(180),
}).strict();

export async function recordVaccination(context: AppContext, raw: unknown) {
  const input = vaccinationSchema.parse(raw);
  return context.prisma.$transaction(async (tx) => {
    const existing = await tx.vaccinationRecord.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true } });
    if (existing) return existing;
    if (!context.user.employeeId) throw new HealthStockError("Vincule o usuário autenticado a um profissional de saúde.");
    const [professional, vaccine, patient, warehouse] = await Promise.all([
      tx.healthProfessional.findFirst({ where: { employeeId: context.user.employeeId, isActive: true }, select: { id: true, unitId: true, assignments: { where: { isActive: true }, select: { unitId: true } }, team: { select: { name: true } } } }),
      tx.vaccine.findFirst({ where: { id: input.vaccineId, isActive: true }, select: { id: true, name: true, materialId: true } }),
      tx.patient.findFirst({ where: { id: input.patientId, status: "Ativo" }, select: { id: true } }),
      tx.warehouse.findFirst({ where: { id: input.warehouseId, isActive: true }, select: { id: true, healthUnitId: true } }),
    ]);
    if (!professional || !vaccine?.materialId || !patient || !warehouse?.healthUnitId) throw new HealthStockError("Paciente, profissional, imunobiológico ou estoque assistencial inválido.");
    assertHealthUnitAccess(context.user, warehouse.healthUnitId);
    if (professional.unitId !== warehouse.healthUnitId && !professional.assignments.some(link => link.unitId === warehouse.healthUnitId)) throw new HealthStockError("O profissional não possui vínculo ativo com a unidade da aplicação.");
    const stock = await tx.materialStock.findUnique({ where: { warehouseId_materialId_batchNumber: { warehouseId: warehouse.id, materialId: vaccine.materialId, batchNumber: input.batchNumber } } });
    if (!stock || stock.blockedAt || (stock.expirationDate && stock.expirationDate < new Date())) throw new HealthStockError("Lote do imunobiológico indisponível, bloqueado ou vencido.");
    const { movement } = await applyStockMovement(tx, { kind: "EXIT", warehouseId: warehouse.id, materialId: vaccine.materialId, batchNumber: input.batchNumber, quantity: input.quantity, reason: "APLICACAO_IMUNOBIOLOGICO", actor: { usuarioId: context.user.id, employeeId: context.user.employeeId } });
    return tx.vaccinationRecord.create({ data: { vaccineId: vaccine.id, patientId: patient.id, professionalId: professional.id, unitId: warehouse.healthUnitId, doseNumber: input.doseNumber, lotNumber: input.batchNumber, citizenCondition: input.citizenCondition, strategy: input.strategy, applicationSite: input.applicationSite, applicationReason: input.applicationReason, administrationRoute: input.administrationRoute, shift: input.shift, teamSnapshot: professional.team?.name, stockId: stock.id, movementId: movement.id, idempotencyKey: input.idempotencyKey }, select: { id: true } });
  });
}
