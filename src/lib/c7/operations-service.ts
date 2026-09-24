import type { PrismaClient } from "@prisma/client";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

export class C7OperationError extends Error {}

type Actor = { usuarioId: string };

function required(value: string | undefined, label: string) {
  const normalized = value?.trim();
  if (!normalized) throw new C7OperationError(`${label} é obrigatório.`);
  return normalized;
}

function optionalDate(value?: Date) {
  if (!value) return undefined;
  if (Number.isNaN(value.valueOf())) throw new C7OperationError("Data inválida.");
  return value;
}

export async function createInternalControlPlan(db: PrismaClient, actor: Actor, input: { title: string; reference: string; dueAt?: Date }) {
  const title = required(input.title, "Título do plano");
  const reference = required(input.reference, "Referência");
  const dueAt = optionalDate(input.dueAt);
  return db.internalControlPlan.create({ data: { title, reference, dueAt, ownerId: required(actor.usuarioId, "Usuário responsável") } });
}

export async function createInternalControlFinding(db: PrismaClient, actor: Actor, input: { planId: string; title: string; description: string; responsibleId?: string; evidenceDocumentId?: string; dueAt?: Date }) {
  const planId = required(input.planId, "Plano de controle");
  const title = required(input.title, "Título do apontamento");
  const description = required(input.description, "Descrição do apontamento");
  const dueAt = optionalDate(input.dueAt);
  return db.$transaction(async (tx) => {
    const [plan, responsible, evidence] = await Promise.all([
      tx.internalControlPlan.findUnique({ where: { id: planId }, select: { id: true, status: true } }),
      input.responsibleId?.trim() ? tx.employee.findFirst({ where: { id: input.responsibleId.trim(), isActive: true }, select: { id: true } }) : null,
      input.evidenceDocumentId?.trim() ? tx.document.findFirst({ where: { id: input.evidenceDocumentId.trim(), status: "Válido" }, select: { id: true } }) : null,
    ]);
    if (!plan || plan.status !== "ABERTO") throw new C7OperationError("O apontamento exige um plano de controle aberto.");
    if (input.responsibleId?.trim() && !responsible) throw new C7OperationError("Servidor responsável não encontrado ou inativo.");
    if (input.evidenceDocumentId?.trim() && !evidence) throw new C7OperationError("A evidência deve apontar para um documento GED válido.");
    const finding = await tx.internalControlFinding.create({
      data: { planId, title, description, dueAt, responsibleId: responsible?.id, evidenceDocumentId: evidence?.id },
    });
    await writeAuditEvent(tx, { actorUsuarioId: required(actor.usuarioId, "Usuário responsável"), eventType: auditEventTypes.internalControlFindingRegistered, targetType: "INTERNAL_CONTROL_FINDING", targetId: finding.id });
    return finding;
  });
}

export async function resolveInternalControlFinding(db: PrismaClient, actor: Actor, findingId: string) {
  const id = required(findingId, "Apontamento");
  return db.$transaction(async (tx) => {
    const finding = await tx.internalControlFinding.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!finding || finding.status === "RESOLVIDO") throw new C7OperationError("Apontamento não encontrado ou já resolvido.");
    const resolved = await tx.internalControlFinding.update({ where: { id }, data: { status: "RESOLVIDO", resolvedAt: new Date() } });
    await writeAuditEvent(tx, { actorUsuarioId: required(actor.usuarioId, "Usuário responsável"), eventType: auditEventTypes.internalControlFindingRegistered, targetType: "INTERNAL_CONTROL_FINDING", targetId: resolved.id });
    return resolved;
  });
}

export async function registerFleetOperation(db: PrismaClient, actor: Actor, input: { assetId: string; type: "ABASTECIMENTO" | "MANUTENCAO" | "ORDEM_SERVICO"; occurredAt: Date; odometer?: number; quantity?: number; cost: number; description: string; supplierName?: string; evidenceDocumentId?: string }) {
  const assetId = required(input.assetId, "Veículo");
  const description = required(input.description, "Descrição");
  const occurredAt = optionalDate(input.occurredAt)!;
  if (!Number.isFinite(input.cost) || input.cost < 0) throw new C7OperationError("Custo inválido.");
  if (input.odometer !== undefined && (!Number.isFinite(input.odometer) || input.odometer < 0)) throw new C7OperationError("Quilometragem inválida.");
  if (input.quantity !== undefined && (!Number.isFinite(input.quantity) || input.quantity <= 0)) throw new C7OperationError("Quantidade inválida.");
  if (!["ABASTECIMENTO", "MANUTENCAO", "ORDEM_SERVICO"].includes(input.type)) throw new C7OperationError("Tipo de operação de frota inválido.");
  return db.$transaction(async (tx) => {
    const [asset, evidence] = await Promise.all([
      tx.asset.findFirst({ where: { id: assetId, status: { notIn: ["Baixado", "Inativo"] }, category: { OR: [{ code: { startsWith: "V" } }, { name: { contains: "veículo", mode: "insensitive" } }] } }, select: { id: true } }),
      input.evidenceDocumentId?.trim() ? tx.document.findFirst({ where: { id: input.evidenceDocumentId.trim(), status: "Válido" }, select: { id: true } }) : null,
    ]);
    if (!asset) throw new C7OperationError("Selecione um bem patrimonial ativo classificado como veículo.");
    if (input.evidenceDocumentId?.trim() && !evidence) throw new C7OperationError("A evidência deve apontar para um documento GED válido.");
    const operation = await tx.fleetOperation.create({
      data: { assetId, type: input.type, occurredAt, odometer: input.odometer, quantity: input.quantity, cost: input.cost, description, supplierName: input.supplierName?.trim() || undefined, evidenceDocumentId: evidence?.id, createdById: required(actor.usuarioId, "Usuário responsável") },
    });
    await writeAuditEvent(tx, { actorUsuarioId: required(actor.usuarioId, "Usuário responsável"), eventType: auditEventTypes.fleetOperationRegistered, targetType: "FLEET_OPERATION", targetId: operation.id });
    return operation;
  });
}
