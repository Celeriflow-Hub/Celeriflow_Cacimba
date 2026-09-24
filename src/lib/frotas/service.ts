import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { AppContext } from "@/lib/platform/tenant-context";
import { AccessError, canPerformModuleOperation, canViewModule, isSystemAdministrator } from "@/lib/platform/tenant-context";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { dateOnly, fleetMutationOperation, fleetMutationSchema, nextOccurrence, todayInBrazil, type FleetMutation } from "./contract";
import { applyStockMovement } from "@/lib/patrimonio/stock-service";

export class FleetError extends Error {}
export type FleetScope = { actorId: string; employeeId: string | null; departmentId: string | null; administrator: boolean; canReadAssets: boolean; canIssueStock: boolean };
type Tx = Prisma.TransactionClient;
export function fleetScope(context: AppContext): FleetScope {
  if (!canViewModule(context.user, "FROTAS")) throw new AccessError("Seu perfil não permite acessar Frotas.", 403);
  const administrator = isSystemAdministrator(context.user);
  if (!administrator && !context.user.departmentId) throw new AccessError("Vincule o usuário a um setor para acessar os registros de Frotas.", 403);
  return { actorId: context.user.id, employeeId: context.user.employeeId, departmentId: context.user.departmentId, administrator, canReadAssets: canViewModule(context.user, "PATRIMONIO"), canIssueStock: canPerformModuleOperation(context.user, "PATRIMONIO", "create") };
}
export function departmentWhere(scope: FleetScope): { departmentId?: string } {
  return scope.administrator ? {} : { departmentId: scope.departmentId! };
}
async function requireDepartment(tx: Tx, scope: FleetScope, id: string) {
  if (!scope.administrator && id !== scope.departmentId) throw new FleetError("O setor está fora do seu escopo de acesso.");
  const department = await tx.department.findFirst({ where: { id, isActive: true }, select: { id: true } });
  if (!department) throw new FleetError("Selecione um setor ativo do organograma.");
}
async function requireUnit(tx: Tx, scope: FleetScope, id: string, active = true) {
  const unit = await tx.fleetUnit.findFirst({ where: { id, ...departmentWhere(scope) }, include: { asset: { select: { status: true } } } });
  if (!unit || (active && (unit.status === "INATIVO" || !unit.departmentId || unit.asset?.status === "Baixado" || unit.asset?.status === "Inativo"))) throw new FleetError("Unidade da frota não encontrada, inativa, baixada, sem setor ou fora do seu setor.");
  return unit;
}
async function requireReplayScope(tx: Tx, scope: FleetScope, type: string, id: string) {
  if (scope.administrator) return;
  if (type === "FLEET_UNIT") { await requireUnit(tx, scope, id, false); return; }
  if (type === "FLEET_ROUTE") {
    if (!await tx.fleetRoute.count({ where: { id, ...departmentWhere(scope) } })) throw new FleetError("Rota fora do seu setor atual.");
    return;
  }
  const record = type === "FLEET_USAGE" ? await tx.fleetUsage.findUnique({ where: { id }, select: { unitId: true } })
    : type === "FLEET_PLAN" ? await tx.fleetPlan.findUnique({ where: { id }, select: { unitId: true } })
    : type === "FLEET_WORK_ORDER" ? await tx.fleetWorkOrder.findUnique({ where: { id }, select: { unitId: true } })
    : type === "FLEET_CONSUMPTION" ? await tx.fleetConsumption.findUnique({ where: { id }, select: { unitId: true } })
    : type === "FLEET_EXPENSE" ? await tx.fleetExpense.findUnique({ where: { id }, select: { unitId: true } })
    : type === "FLEET_DOCUMENT" ? await tx.fleetDocument.findUnique({ where: { id }, select: { unitId: true } })
    : type === "FLEET_OCCURRENCE" ? await tx.fleetOccurrence.findUnique({ where: { id }, select: { unitId: true } }) : null;
  if (!record) throw new FleetError("Registro confirmado não encontrado.");
  await requireUnit(tx, scope, record.unitId, false);
}
async function requireEmployee(tx: Tx, scope: FleetScope, id: string | null, departmentId: string | null) {
  if (!id) return null;
  const employee = await tx.employee.findFirst({ where: { id, isActive: true, ...(scope.administrator ? {} : { departmentId }) }, select: { id: true, name: true } });
  if (!employee) throw new FleetError("Servidor não encontrado, inativo ou fora do seu setor.");
  return employee;
}
async function supplier(tx: Tx, id: string | null) {
  if (!id) return null;
  const row = await tx.supplier.findFirst({ where: { id, status: "Ativo" }, select: { id: true, person: { select: { fullName: true } }, company: { select: { tradeName: true, corporateName: true } } } });
  if (!row) throw new FleetError("Fornecedor não encontrado ou inativo.");
  return { id: row.id, name: row.person?.fullName || row.company?.tradeName || row.company?.corporateName || "Fornecedor cadastrado" };
}
const decimal = (value: string | null) => value === null ? null : new Prisma.Decimal(value);
function checkVersion(actual: Date, version?: string) {
  if (!version || actual.toISOString() !== version) throw new FleetError("Este registro foi atualizado por outra sessão. Reabra a ficha antes de editar.");
}
async function apply(tx: Tx, scope: FleetScope, input: FleetMutation): Promise<{ targetType: string; targetId: string }> {
  const createdById = scope.actorId;
  switch (input.kind) {
    case "unit": {
      const d = input.data, { id, version, status, ...data } = d;
      await requireDepartment(tx, scope, d.departmentId);
      const existing = id ? await requireUnit(tx, scope, id, false) : null;
      if (existing) {
        checkVersion(existing.updatedAt, version);
        if (existing.assetId && d.assetId !== existing.assetId && await tx.fleetExpense.count({ where: { unitId: existing.id } }) + await tx.fleetUsage.count({ where: { unitId: existing.id } }) + await tx.fleetPlan.count({ where: { unitId: existing.id } }) + await tx.fleetDocument.count({ where: { unitId: existing.id } }) + await tx.fleetOccurrence.count({ where: { unitId: existing.id } }) > 0) throw new FleetError("Uma unidade vinculada com histórico não pode trocar ou remover seu bem patrimonial.");
        if (existing.departmentId !== d.departmentId) throw new FleetError("O setor de uma unidade cadastrada não pode ser transferido por esta ficha.");
        if (existing.category !== d.category && await tx.fleetExpense.count({ where: { unitId: existing.id } }) + await tx.fleetUsage.count({ where: { unitId: existing.id } }) + await tx.fleetPlan.count({ where: { unitId: existing.id } }) + await tx.fleetDocument.count({ where: { unitId: existing.id } }) + await tx.fleetOccurrence.count({ where: { unitId: existing.id } }) > 0) throw new FleetError("Uma unidade com histórico não pode mudar de categoria.");
        if (d.category === "AGREGADO" && await tx.fleetUnit.count({ where: { parentId: existing.id } }) > 0) throw new FleetError("Uma unidade principal com agregados não pode se tornar agregado.");
      }
      if (d.category !== "AGREGADO" && d.parentId) throw new FleetError("Apenas agregados podem ter unidade principal.");
      if (d.parentId) {
        const parent = await requireUnit(tx, scope, d.parentId);
        if (parent.id === d.id || parent.category === "AGREGADO" || parent.departmentId !== d.departmentId) throw new FleetError("Selecione uma unidade principal do mesmo setor, diferente do agregado.");
      }
      if (d.assetId && d.assetId !== existing?.assetId) {
        if (!scope.canReadAssets) throw new FleetError("Seu perfil não permite consultar Patrimônio para criar esse vínculo.");
        const asset = await tx.asset.findFirst({ where: { id: d.assetId, departmentId: d.departmentId, status: { notIn: ["Baixado", "Inativo"] } }, select: { id: true } });
        if (!asset) throw new FleetError("O bem patrimonial deve estar ativo e pertencer ao mesmo setor.");
      }
      if (d.assetId) {
        const asset = await tx.asset.findUniqueOrThrow({ where: { id: d.assetId }, select: { departmentId: true, responsibleId: true } });
        if (asset.departmentId !== d.departmentId || asset.responsibleId !== d.responsibleId) throw new FleetError("Setor e responsável do bem são definidos em Patrimônio. Recarregue os dados de origem.");
      }
      await requireEmployee(tx, scope, d.responsibleId, d.departmentId);
      const values = { ...data, operationalStatus: status };
      const unit = existing ? await tx.fleetUnit.update({ where: { id: existing.id, updatedAt: existing.updatedAt }, data: values }) : await tx.fleetUnit.create({ data: { ...values, createdById } });
      return { targetType: "FLEET_UNIT", targetId: unit.id };
    }
    case "route": {
      const { id, version, ...data } = input.data;
      await requireDepartment(tx, scope, data.departmentId);
      const existing = id ? await tx.fleetRoute.findFirst({ where: { id, ...departmentWhere(scope) } }) : null;
      if (id && !existing) throw new FleetError("Rota não encontrada ou fora do seu setor.");
      if (existing) { checkVersion(existing.updatedAt, version); if (existing.departmentId !== data.departmentId) throw new FleetError("O setor da rota não pode ser alterado."); }
      const route = existing ? await tx.fleetRoute.update({ where: { id: existing.id, updatedAt: existing.updatedAt }, data }) : await tx.fleetRoute.create({ data: { ...data, createdById } });
      return { targetType: "FLEET_ROUTE", targetId: route.id };
    }
    case "usage": {
      const d = input.data, unit = await requireUnit(tx, scope, d.unitId);
      if (unit.category !== "VEICULO") throw new FleetError("O histórico de utilização deve selecionar um veículo.");
      if (unit.status === "EM_MANUTENCAO") throw new FleetError("O veículo está em manutenção e não pode registrar nova utilização.");
      const startedAt = new Date(`${d.startedAt}:00-03:00`), endedAt = new Date(`${d.endedAt}:00-03:00`);
      dateOnly(d.startedAt.slice(0, 10)); dateOnly(d.endedAt.slice(0, 10));
      if (Number.isNaN(startedAt.valueOf()) || Number.isNaN(endedAt.valueOf()) || startedAt > endedAt || !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.startedAt.slice(11)) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.endedAt.slice(11))) throw new FleetError("Informe um período de utilização válido (horário de Brasília).");
      if ((d.initialReading === null) !== (d.finalReading === null) || (d.initialReading !== null && decimal(d.finalReading)!.lt(decimal(d.initialReading)!))) throw new FleetError("Informe as duas leituras; a final deve ser igual ou maior que a inicial.");
      const employee = await requireEmployee(tx, scope, d.employeeId, unit.departmentId);
      const route = d.routeId ? await tx.fleetRoute.findFirst({ where: { id: d.routeId, departmentId: unit.departmentId!, active: true } }) : null;
      if (d.routeId && !route) throw new FleetError("Selecione uma rota ativa do mesmo setor do veículo.");
      const row = await tx.fleetUsage.create({ data: { ...d, startedAt, endedAt, initialReading: decimal(d.initialReading), finalReading: decimal(d.finalReading), employeeName: employee?.name, routeSnapshot: route ? `${route.code} · ${route.name} | ${route.origin} → ${route.destination} | ${route.itinerary}` : null, createdById } });
      return { targetType: "FLEET_USAGE", targetId: row.id };
    }
    case "plan": {
      const d = input.data; await requireUnit(tx, scope, d.unitId);
      const row = await tx.fleetPlan.create({ data: { ...d, firstDueAt: dateOnly(d.firstDueAt), nextDueAt: dateOnly(d.firstDueAt), estimatedCost: decimal(d.estimatedCost), createdById } });
      return { targetType: "FLEET_PLAN", targetId: row.id };
    }
    case "generateOrder": {
      const plan = await tx.fleetPlan.findFirst({ where: { id: input.planId, unit: departmentWhere(scope) } });
      if (!plan || !plan.active) throw new FleetError("Plano não encontrado ou inativo.");
      await requireUnit(tx, scope, plan.unitId);
      const scheduledAt = dateOnly(input.scheduledAt), days = (scheduledAt.valueOf() - plan.firstDueAt.valueOf()) / 86400000;
      if (days < 0 || days % plan.intervalDays !== 0) throw new FleetError("A data deve corresponder a uma ocorrência da periodicidade do plano.");
      const existing = await tx.fleetWorkOrder.findUnique({ where: { planId_scheduledAt: { planId: plan.id, scheduledAt } } });
      if (existing) return { targetType: "FLEET_WORK_ORDER", targetId: existing.id };
      const order = await tx.fleetWorkOrder.create({ data: { planId: plan.id, unitId: plan.unitId, scheduledAt, title: plan.title, type: plan.type, services: plan.services, intervalDays: plan.intervalDays, estimatedCost: plan.estimatedCost, createdById } });
      return { targetType: "FLEET_WORK_ORDER", targetId: order.id };
    }
    case "startOrder": {
      const order = await tx.fleetWorkOrder.findFirst({ where: { id: input.orderId, unit: departmentWhere(scope) } });
      if (!order) throw new FleetError("OS não encontrada ou fora do seu setor.");
      if (order.status === "CONCLUIDA") throw new FleetError("Esta ordem já foi concluída.");
      const unit = await requireUnit(tx, scope, order.unitId);
      if (order.status === "EMITIDA") {
        const maintenance = unit.assetId ? await tx.assetMaintenance.create({ data: { assetId: unit.assetId, description: `${order.title}\n${order.services}`, status: "Em manutenção", startDate: order.scheduledAt } }) : null;
        await tx.fleetWorkOrder.update({ where: { id: order.id, status: "EMITIDA" }, data: { status: "EM_EXECUCAO", startedAt: new Date(), assetMaintenanceId: maintenance?.id } });
      }
      return { targetType: "FLEET_WORK_ORDER", targetId: order.id };
    }
    case "completeOrder": {
      const d = input.data, order = await tx.fleetWorkOrder.findFirst({ where: { id: d.orderId, unit: departmentWhere(scope) } });
      if (!order) throw new FleetError("OS não encontrada ou fora do seu setor.");
      if (order.status === "CONCLUIDA") {
        if (order.completedAt?.getTime() !== dateOnly(d.completedAt).getTime() || order.performed !== d.performed || order.result !== d.result || (order.actualCost?.toString() ?? null) !== (decimal(d.actualCost)?.toString() ?? null)) throw new FleetError("A OS já foi concluída com outros dados; seu histórico foi preservado.");
        return { targetType: "FLEET_WORK_ORDER", targetId: order.id };
      }
      const unit = await requireUnit(tx, scope, order.unitId, false);
      if (unit.asset?.status === "Baixado" || unit.asset?.status === "Inativo") throw new FleetError("O bem está baixado ou inativo. Conclua a manutenção em Patrimônio antes de registrar a operação.");
      if (order.status !== "EM_EXECUCAO") throw new FleetError("Inicie a execução antes de concluir a OS.");
      const completedAt = dateOnly(d.completedAt);
      if (completedAt > dateOnly(todayInBrazil())) throw new FleetError("Uma execução realizada não pode ter data futura.");
      await tx.fleetWorkOrder.update({ where: { id: order.id, status: "EM_EXECUCAO" }, data: { status: "CONCLUIDA", completedAt, performed: d.performed, result: d.result, actualCost: decimal(d.actualCost) } });
      if (order.assetMaintenanceId) await tx.assetMaintenance.update({ where: { id: order.assetMaintenanceId }, data: { status: "Concluída", endDate: completedAt, description: `${d.performed}\nResultado: ${d.result}`, cost: d.actualCost === null ? null : Number(d.actualCost) } });
      const expense = { unitId: order.unitId, nature: "MANUTENCAO", occurredAt: completedAt, amount: decimal(d.actualCost), description: d.performed, sourceType: "OS", sourceId: order.id, sourceKey: order.assetMaintenanceId ? `asset-maintenance:${order.assetMaintenanceId}` : `order:${order.id}`, reference: d.reference, createdById };
      await tx.fleetExpense.upsert({ where: { sourceKey: expense.sourceKey }, create: expense, update: { description: expense.description, reference: expense.reference, createdById } });
      await tx.fleetPlan.updateMany({ where: { id: order.planId, nextDueAt: { lte: order.scheduledAt } }, data: { nextDueAt: nextOccurrence(order.scheduledAt, order.intervalDays) } });
      return { targetType: "FLEET_WORK_ORDER", targetId: order.id };
    }
    case "consumption": {
      const d = input.data, unit = await requireUnit(tx, scope, d.unitId);
      const { stockMode, stockId, stockMovementId, ...data } = d;
      let movementId: string | null = null, cost = decimal(d.cost), material = d.material, measurementUnit = d.measurementUnit, quantity = new Prisma.Decimal(d.quantity), occurredAt = dateOnly(d.occurredAt);
      if (stockMode !== "LOCAL") {
        if (!scope.canReadAssets || (stockMode === "STOCK_EXIT" && !scope.canIssueStock)) throw new FleetError("Seu perfil não permite consultar ou baixar materiais do Almoxarifado.");
        if (d.origin !== "PROPRIO") throw new FleetError("Somente consumo de material próprio pode usar uma saída do Almoxarifado.");
        if (stockMode === "STOCK_EXIT" && (!stockId || stockMovementId)) throw new FleetError("Selecione um estoque/lote, sem informar uma saída existente.");
        if (stockMode === "STOCK_MOVEMENT" && (!stockMovementId || stockId)) throw new FleetError("Selecione uma saída existente, sem informar estoque para nova baixa.");
        const movement = stockMode === "STOCK_MOVEMENT" ? await tx.materialMovement.findFirst({ where: { id: stockMovementId!, type: "Saída", departmentId: unit.departmentId, obrasServicoId: null, assetAcquisition: null }, include: { material: true } }) : null;
        const stock = stockMode === "STOCK_EXIT" ? await tx.materialStock.findFirst({ where: { id: stockId!, warehouse: { isActive: true } }, include: { material: true } }) : null;
        if (!movement && !stock) throw new FleetError("Estoque ou saída não encontrados, já destinados a outro processo ou fora do setor da unidade.");
        const sourceMaterial = (movement || stock)!.material;
        if (!["L", "KG", "UN"].includes(sourceMaterial.unitOfMeasure.toUpperCase())) throw new FleetError("O material deve estar cadastrado em L, KG ou UN, sem conversão implícita de unidades.");
        if (stock?.expirationDate && stock.expirationDate < dateOnly(todayInBrazil())) throw new FleetError("O lote está vencido e não pode ser consumido.");
        material = `${sourceMaterial.code} · ${sourceMaterial.name}`; measurementUnit = sourceMaterial.unitOfMeasure.toUpperCase() as typeof measurementUnit;
        if (movement) { quantity = new Prisma.Decimal(String(movement.quantity)); occurredAt = dateOnly(movement.date.toISOString().slice(0, 10)); }
        if (quantity.lte(0)) throw new FleetError("A saída deve ter quantidade positiva.");
        const source = movement || (await applyStockMovement(tx, { kind: "EXIT", warehouseId: stock!.warehouseId, materialId: stock!.materialId, batchNumber: stock!.batchNumber, quantity: quantity.toNumber(), departmentId: unit.departmentId, reason: `Consumo Frotas · ${unit.code}`, actor: { usuarioId: scope.actorId, employeeId: scope.employeeId } })).movement;
        movementId = source.id;
        const prior = await tx.fleetConsumption.findUnique({ where: { stockMovementId: movementId } });
        if (prior) {
          if (prior.unitId !== unit.id || prior.type !== d.type || prior.workOrderId !== d.workOrderId) throw new FleetError("Esta saída já foi apropriada em outro consumo. Abra o registro de origem.");
          return { targetType: "FLEET_CONSUMPTION", targetId: prior.id };
        }
        cost = source.unitValue == null ? null : new Prisma.Decimal(String(source.unitValue)).mul(quantity).toDecimalPlaces(2);
      } else if (stockId || stockMovementId) throw new FleetError("Um registro local não pode informar vínculo de estoque.");
      const provider = await supplier(tx, d.supplierId);
      if (d.workOrderId && !await tx.fleetWorkOrder.findFirst({ where: { id: d.workOrderId, unitId: d.unitId } })) throw new FleetError("A OS vinculada deve pertencer à mesma unidade.");
      const row = await tx.fleetConsumption.create({ data: { ...data, occurredAt, quantity, cost, material, measurementUnit, stockMovementId: movementId, supplierName: provider?.name, createdById } });
      await tx.fleetExpense.create({ data: { unitId: d.unitId, nature: d.type, occurredAt: row.occurredAt, amount: row.cost, description: material, sourceType: "CONSUMO", sourceId: row.id, sourceKey: `consumption:${row.id}`, reference: d.reference, createdById } });
      return { targetType: "FLEET_CONSUMPTION", targetId: row.id };
    }
    case "document": {
      const d = input.data, unit = await requireUnit(tx, scope, d.unitId);
      if (d.kind === "OBRIGACAO" && (unit.category !== "VEICULO" || !["IPVA", "LICENCIAMENTO", "OUTRO"].includes(d.type) || !d.scheduledAt)) throw new FleetError("A obrigação deve selecionar veículo, tipo e data de agendamento.");
      if (d.kind === "SEGURO" && !d.startsAt) throw new FleetError("Informe o início da vigência do seguro.");
      if (d.startsAt && d.startsAt > d.dueAt) throw new FleetError("O início da vigência deve preceder o vencimento.");
      if (d.scheduledAt && d.scheduledAt > d.dueAt) throw new FleetError("O agendamento deve preceder o vencimento.");
      const insurer = await supplier(tx, d.insurerId);
      const { id, version, ...data } = d;
      const values = { ...data, startsAt: d.startsAt ? dateOnly(d.startsAt) : null, scheduledAt: d.scheduledAt ? dateOnly(d.scheduledAt) : null, dueAt: dateOnly(d.dueAt), value: decimal(d.value), insurerName: insurer?.name ?? null };
      const existing = id ? await tx.fleetDocument.findFirst({ where: { id, unit: departmentWhere(scope) } }) : null;
      if (id && !existing) throw new FleetError("Documento não encontrado ou fora do seu setor.");
      if (existing) { checkVersion(existing.updatedAt, version); if (existing.status === "CUMPRIDA" || existing.unitId !== d.unitId || existing.kind !== d.kind) throw new FleetError("Documento cumprido, objeto e natureza têm histórico protegido."); }
      const row = existing ? await tx.fleetDocument.update({ where: { id: existing.id, updatedAt: existing.updatedAt }, data: values }) : await tx.fleetDocument.create({ data: { ...values, createdById } });
      return { targetType: "FLEET_DOCUMENT", targetId: row.id };
    }
    case "fulfillDocument": {
      const d = input.data, row = await tx.fleetDocument.findFirst({ where: { id: d.documentId, unit: departmentWhere(scope) } });
      if (!row || row.kind === "SEGURO") throw new FleetError("Selecione uma obrigação ou documento do seu setor.");
      if (row.status === "CUMPRIDA") return { targetType: "FLEET_DOCUMENT", targetId: row.id };
      const fulfilledAt = dateOnly(d.fulfilledAt);
      if (fulfilledAt > dateOnly(todayInBrazil())) throw new FleetError("O cumprimento administrativo não pode ter data futura.");
      await tx.fleetDocument.update({ where: { id: row.id }, data: { status: "CUMPRIDA", fulfilledAt, fulfillmentNote: d.fulfillmentNote } });
      return { targetType: "FLEET_DOCUMENT", targetId: row.id };
    }
    case "occurrence": {
      const d = input.data; await requireUnit(tx, scope, d.unitId);
      const row = await tx.fleetOccurrence.create({ data: { ...d, occurredAt: dateOnly(d.occurredAt), involvedValue: decimal(d.involvedValue), createdById } });
      return { targetType: "FLEET_OCCURRENCE", targetId: row.id };
    }
    case "expense": {
      const d = input.data; await requireUnit(tx, scope, d.unitId);
      if (d.occurrenceId && !await tx.fleetOccurrence.findFirst({ where: { id: d.occurrenceId, unitId: d.unitId } })) throw new FleetError("A ocorrência deve pertencer à mesma unidade da frota.");
      const row = await tx.fleetExpense.create({ data: { unitId: d.unitId, occurredAt: dateOnly(d.occurredAt), amount: decimal(d.amount), description: d.description, nature: "OUTROS", reference: d.reference, sourceType: d.occurrenceId ? "OCORRENCIA" : "LOCAL", sourceId: d.occurrenceId || input.requestId, sourceKey: d.occurrenceId ? `occurrence:${d.occurrenceId}` : `manual:${input.requestId}`, createdById } });
      return { targetType: "FLEET_EXPENSE", targetId: row.id };
    }
  }
}

export async function mutateFleet(context: AppContext, raw: unknown) {
  const input = fleetMutationSchema.parse(raw), scope = fleetScope(context);
  if (!canPerformModuleOperation(context.user, "FROTAS", fleetMutationOperation(input))) throw new AccessError("Seu perfil não permite confirmar esta operação de Frotas.", 403);
  const payloadHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await context.prisma.$transaction(async tx => {
        const prior = await tx.fleetMutation.findUnique({ where: { requestId: input.requestId } });
        if (prior) {
          if (prior.actorId !== scope.actorId || prior.payloadHash !== payloadHash) throw new FleetError("A identificação desta confirmação já foi utilizada com outros dados.");
          await requireReplayScope(tx, scope, prior.targetType, prior.targetId);
          return { id: prior.targetId, type: prior.targetType, repeated: true };
        }
        const target = await apply(tx, scope, input);
        await tx.fleetMutation.create({ data: { requestId: input.requestId, actorId: scope.actorId, payloadHash, ...target } });
        await writeAuditEvent(tx, { actorUsuarioId: scope.actorId, eventType: auditEventTypes.fleetOperationRegistered, ...target });
        return { id: target.targetId, type: target.targetType, repeated: false };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
    } catch (error) {
      const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null;
      if ((code === "P2034" || code === "P2002") && attempt < 3) continue;
      if (code === "P2002") throw new FleetError("Já existe um registro com essa identificação, vínculo ou origem. Reabra o registro existente.");
      if (code === "P2025") throw new FleetError("O registro mudou durante a operação. Recarregue e tente novamente.");
      throw error;
    }
  }
  throw new FleetError("Não foi possível confirmar após concorrência. Tente novamente.");
}
