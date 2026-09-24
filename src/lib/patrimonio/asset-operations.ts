import { Prisma } from "@prisma/client";
import { z } from "zod";
import type { AppContext } from "@/lib/platform/tenant-context";
import { AccessError, canPerformModuleOperation, canViewModule, isSystemAdministrator } from "@/lib/platform/tenant-context";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { dateOnly, dateSchema, moneySchema, todayInBrazil } from "@/lib/frotas/contract";

export class AssetOperationError extends Error {}
const id = z.string().trim().min(1).max(100);
const note = z.string().trim().min(1).max(10000);
export const assetOperationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("transfer"), assetId: id, version: z.iso.datetime(), departmentId: id, responsibleId: z.string().max(100).default(""), reason: note }).strict(),
  z.object({ kind: z.literal("startMaintenance"), assetId: id, version: z.iso.datetime(), description: note, startDate: dateSchema }).strict(),
  z.object({ kind: z.literal("completeMaintenance"), maintenanceId: id, endDate: dateSchema, description: note, cost: z.union([moneySchema, z.literal("")]) }).strict(),
]);
export type AssetOperationInput = z.input<typeof assetOperationSchema>;

export function assetOperationWhere(context: AppContext): Prisma.AssetWhereInput {
  if (!canViewModule(context.user, "PATRIMONIO")) throw new AccessError("Seu perfil não permite acessar Patrimônio.", 403);
  if (isSystemAdministrator(context.user)) return {};
  if (!context.user.departmentId) throw new AccessError("Vincule o usuário a um setor para operar os bens patrimoniais.", 403);
  return { departmentId: context.user.departmentId };
}

export async function operateAsset(context: AppContext, raw: unknown) {
  const input = assetOperationSchema.parse(raw), scope = assetOperationWhere(context);
  if (!canPerformModuleOperation(context.user, "PATRIMONIO", "update")) throw new AccessError("Seu perfil não permite editar o bem patrimonial.", 403);
  return context.prisma.$transaction(async tx => {
    if (input.kind === "completeMaintenance") {
      const m = await tx.assetMaintenance.findFirst({ where: { id: input.maintenanceId, asset: scope }, include: { asset: true } });
      if (!m) throw new AssetOperationError("Manutenção não encontrada ou fora do seu setor.");
      const endDate = dateOnly(input.endDate), cost = input.cost === "" ? null : new Prisma.Decimal(input.cost).toNumber();
      if (m.status === "Concluída") {
        if (m.endDate?.valueOf() === endDate.valueOf() && m.description === input.description && m.cost === cost) return { assetId: m.assetId };
        throw new AssetOperationError("A manutenção já foi concluída com outros dados.");
      }
      if (m.asset.status === "Baixado" || m.asset.status === "Inativo") throw new AssetOperationError("O bem está baixado ou inativo.");
      if (endDate > dateOnly(todayInBrazil()) || endDate < dateOnly(m.startDate.toISOString().slice(0, 10))) throw new AssetOperationError("A conclusão deve ocorrer entre o início e a data atual.");
      await tx.assetMaintenance.update({ where: { id: m.id, updatedAt: m.updatedAt }, data: { status: "Concluída", endDate, cost, description: input.description } });
      await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "ASSET_MAINTENANCE", targetId: m.id });
      return { assetId: m.assetId };
    }
    const asset = await tx.asset.findFirst({ where: { id: input.assetId, ...scope } });
    if (!asset || asset.status === "Baixado" || asset.status === "Inativo") throw new AssetOperationError("Bem não encontrado, baixado, inativo ou fora do seu setor.");
    if (asset.updatedAt.toISOString() !== input.version) throw new AssetOperationError("O bem foi alterado por outra sessão. Reabra a ficha.");
    if (input.kind === "transfer") {
      const department = await tx.department.findFirst({ where: { id: input.departmentId, isActive: true } });
      if (!department) throw new AssetOperationError("Selecione um setor ativo.");
      if (input.responsibleId && !await tx.employee.count({ where: { id: input.responsibleId, departmentId: input.departmentId, isActive: true } })) throw new AssetOperationError("O responsável deve ser servidor ativo do setor de destino.");
      const responsibleId = input.responsibleId || null;
      if (asset.departmentId === input.departmentId && asset.responsibleId === responsibleId) throw new AssetOperationError("Informe um setor ou responsável diferente do atual.");
      await tx.assetTransfer.create({ data: { assetId: asset.id, reason: input.reason, fromDepartmentId: asset.departmentId, toDepartmentId: input.departmentId, fromResponsibleId: asset.responsibleId, toResponsibleId: responsibleId, status: "Aprovada" } });
      await tx.asset.update({ where: { id: asset.id, updatedAt: asset.updatedAt }, data: { departmentId: input.departmentId, responsibleId } });
    } else {
      const startDate = dateOnly(input.startDate);
      if (startDate > dateOnly(todayInBrazil()) || startDate < dateOnly(asset.acquisitionDate.toISOString().slice(0, 10))) throw new AssetOperationError("O início deve ocorrer entre a aquisição e a data atual.");
      // Advance the version even when another maintenance already keeps the asset unavailable.
      // A retry of the same form cannot create another maintenance after a lost response.
      await tx.asset.update({ where: { id: asset.id, updatedAt: asset.updatedAt }, data: { updatedAt: new Date(Math.max(Date.now(), asset.updatedAt.valueOf() + 1)) } });
      await tx.assetMaintenance.create({ data: { assetId: asset.id, description: input.description, status: "Em manutenção", startDate } });
    }
    await writeAuditEvent(tx, { actorUsuarioId: context.user.id, eventType: auditEventTypes.administrativeMutation, targetType: "ASSET", targetId: asset.id });
    return { assetId: asset.id };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
