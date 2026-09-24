import "server-only";

import type { Prisma } from "@prisma/client";
import { notifyProtocolDepartment } from "./notifications";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { assertGenericWorkflowTransition, assertRequiredSignedProcessDocument, calculateGenericWorkflowDeadline } from "./generic-workflow-policy";

const AWAITING_RECEIPT = "Aguardando Recebimento";

type WorkflowActor = { usuarioId: string; employeeId: string; departmentId: string };

async function loadActiveInstance(tx: Prisma.TransactionClient, processId: string, actor: WorkflowActor) {
  const instance = await tx.genericProcessWorkflowInstance.findUnique({
    where: { processId },
    include: {
      definition: { include: { stages: { orderBy: { position: "asc" } } } },
      process: { select: { id: true, protocolNumber: true, status: true, currentDepartmentId: true } },
    },
  });
  if (!instance) throw new Error("Este processo nao usa o fluxo generico.");
  if (instance.status !== "ACTIVE") throw new Error("O fluxo generico deste processo ja foi encerrado.");
  if (instance.process.currentDepartmentId !== actor.departmentId) throw new Error("Este processo nao pertence ao seu setor.");
  if (instance.process.status === AWAITING_RECEIPT) throw new Error("Receba o processo antes de decidir a etapa.");
  const stage = instance.definition.stages.find((item) => item.position === instance.currentPosition);
  if (!stage) throw new Error("A etapa atual nao existe na versao publicada do fluxo.");
  return { instance, stage };
}

async function assertStageDocument(tx: Prisma.TransactionClient, processId: string, stage: { requiresSignedDocument: boolean; requiredDocumentClassId: string | null }) {
  if (!stage.requiresSignedDocument) return;
  const documents = await tx.processDocument.findMany({
    where: { processId },
    select: {
      document: {
        select: {
          documentClassId: true,
          versions: { where: { status: "SIGNED" }, select: { id: true, signatures: { where: { status: "SIGNED" }, select: { id: true } } } },
        },
      },
    },
  });
  assertRequiredSignedProcessDocument(stage, documents.flatMap((item) => item.document ? [{
    documentClassId: item.document.documentClassId,
    hasSignedFinalVersion: item.document.versions.some((version) => version.signatures.length > 0),
  }] : []));
}

export async function isGenericWorkflowProcess(tx: Prisma.TransactionClient, processId: string) {
  return Boolean(await tx.genericProcessWorkflowInstance.findUnique({ where: { processId }, select: { id: true } }));
}

export async function recordGenericWorkflowReceipt(tx: Prisma.TransactionClient, processId: string, actorUsuarioId: string) {
  const instance = await tx.genericProcessWorkflowInstance.findUnique({ where: { processId }, select: { id: true, currentPosition: true, status: true } });
  if (instance?.status === "ACTIVE") {
    await tx.genericProcessWorkflowEvent.create({ data: { instanceId: instance.id, eventType: "RECEIVED", fromPosition: instance.currentPosition, toPosition: instance.currentPosition, actorUsuarioId } });
  }
}

export async function approveGenericWorkflowProcess(tx: Prisma.TransactionClient, processId: string, actor: WorkflowActor, note: string | null) {
  const { instance, stage } = await loadActiveInstance(tx, processId, actor);
  const transition = assertGenericWorkflowTransition({ action: "APPROVE", currentPosition: instance.currentPosition, totalStages: instance.definition.stages.length, openedByUsuarioId: instance.openedByUsuarioId, actorUsuarioId: actor.usuarioId });
  await assertStageDocument(tx, processId, stage);
  const nextStage = instance.definition.stages.find((item) => item.position === transition.toPosition);
  if (!nextStage) throw new Error("A proxima etapa publicada nao foi encontrada.");
  const dueAt = calculateGenericWorkflowDeadline(new Date(), nextStage.slaCalendarDays, instance.instanceTimeZone);
  await tx.genericProcessWorkflowInstance.update({ where: { id: instance.id }, data: { currentPosition: nextStage.position, dueAt } });
  const movement = await tx.processMovement.create({ data: { processId, fromDepartmentId: actor.departmentId, toDepartmentId: nextStage.departmentId, employeeId: actor.employeeId, reason: note, status: "AWAITING_RECEIPT", dueAt }, select: { id: true } });
  await tx.process.update({ where: { id: processId }, data: { status: AWAITING_RECEIPT, currentDepartmentId: nextStage.departmentId, currentResponsibleEmployeeId: null, expectedCompletionAt: dueAt } });
  await tx.processEvent.create({ data: { processId, eventType: "GENERIC_WORKFLOW_APPROVED", description: note || "Etapa aprovada e encaminhada para a proxima etapa.", previousStatus: instance.process.status, newStatus: AWAITING_RECEIPT, departmentId: actor.departmentId, employeeId: actor.employeeId } });
  await writeAuditEvent(tx, { actorUsuarioId: actor.usuarioId, eventType: auditEventTypes.processUpdated, targetType: "PROCESS", targetId: processId });
  await tx.genericProcessWorkflowEvent.create({ data: { instanceId: instance.id, eventType: "APPROVED", fromPosition: transition.fromPosition, toPosition: nextStage.position, actorUsuarioId: actor.usuarioId, note } });
  await notifyProtocolDepartment(tx, actor.usuarioId, nextStage.departmentId, { processId, type: "GENERIC_WORKFLOW_STAGE", title: `Nova etapa: ${instance.process.protocolNumber}`, message: `O processo aguarda recebimento na etapa ${nextStage.label}.`, priority: "NORMAL", dedupeDiscriminator: movement.id });
}

export async function returnGenericWorkflowProcess(tx: Prisma.TransactionClient, processId: string, actor: WorkflowActor, note: string) {
  const { instance } = await loadActiveInstance(tx, processId, actor);
  const transition = assertGenericWorkflowTransition({ action: "RETURN", currentPosition: instance.currentPosition, totalStages: instance.definition.stages.length, openedByUsuarioId: instance.openedByUsuarioId, actorUsuarioId: actor.usuarioId });
  const previousStage = instance.definition.stages.find((item) => item.position === transition.toPosition);
  if (!previousStage) throw new Error("A etapa anterior publicada nao foi encontrada.");
  const dueAt = calculateGenericWorkflowDeadline(new Date(), previousStage.slaCalendarDays, instance.instanceTimeZone);
  await tx.genericProcessWorkflowInstance.update({ where: { id: instance.id }, data: { currentPosition: previousStage.position, dueAt } });
  const movement = await tx.processMovement.create({ data: { processId, fromDepartmentId: actor.departmentId, toDepartmentId: previousStage.departmentId, employeeId: actor.employeeId, reason: note, status: "AWAITING_RECEIPT", dueAt }, select: { id: true } });
  await tx.process.update({ where: { id: processId }, data: { status: AWAITING_RECEIPT, currentDepartmentId: previousStage.departmentId, currentResponsibleEmployeeId: null, expectedCompletionAt: dueAt } });
  await tx.processEvent.create({ data: { processId, eventType: "GENERIC_WORKFLOW_RETURNED", description: note, previousStatus: instance.process.status, newStatus: AWAITING_RECEIPT, departmentId: actor.departmentId, employeeId: actor.employeeId } });
  await writeAuditEvent(tx, { actorUsuarioId: actor.usuarioId, eventType: auditEventTypes.processUpdated, targetType: "PROCESS", targetId: processId });
  await tx.genericProcessWorkflowEvent.create({ data: { instanceId: instance.id, eventType: "RETURNED", fromPosition: transition.fromPosition, toPosition: previousStage.position, actorUsuarioId: actor.usuarioId, note } });
  await notifyProtocolDepartment(tx, actor.usuarioId, previousStage.departmentId, { processId, type: "GENERIC_WORKFLOW_RETURNED", title: `Processo devolvido: ${instance.process.protocolNumber}`, message: `O processo retornou para a etapa ${previousStage.label}.`, priority: "ALTA", dedupeDiscriminator: movement.id });
}

export async function rejectGenericWorkflowProcess(tx: Prisma.TransactionClient, processId: string, actor: WorkflowActor, note: string) {
  const { instance } = await loadActiveInstance(tx, processId, actor);
  const transition = assertGenericWorkflowTransition({ action: "REJECT", currentPosition: instance.currentPosition, totalStages: instance.definition.stages.length, openedByUsuarioId: instance.openedByUsuarioId, actorUsuarioId: actor.usuarioId });
  await tx.genericProcessWorkflowInstance.update({ where: { id: instance.id }, data: { status: "REJECTED" } });
  await tx.process.update({ where: { id: processId }, data: { status: "Rejeitado", expectedCompletionAt: null } });
  await tx.processEvent.create({ data: { processId, eventType: "GENERIC_WORKFLOW_REJECTED", description: note, previousStatus: instance.process.status, newStatus: "Rejeitado", departmentId: actor.departmentId, employeeId: actor.employeeId } });
  await writeAuditEvent(tx, { actorUsuarioId: actor.usuarioId, eventType: auditEventTypes.processUpdated, targetType: "PROCESS", targetId: processId });
  await tx.genericProcessWorkflowEvent.create({ data: { instanceId: instance.id, eventType: "REJECTED", fromPosition: transition.fromPosition, actorUsuarioId: actor.usuarioId, note } });
}

export async function concludeGenericWorkflowProcess(tx: Prisma.TransactionClient, processId: string, actor: WorkflowActor, note: string) {
  const { instance, stage } = await loadActiveInstance(tx, processId, actor);
  const transition = assertGenericWorkflowTransition({ action: "CONCLUDE", currentPosition: instance.currentPosition, totalStages: instance.definition.stages.length, openedByUsuarioId: instance.openedByUsuarioId, actorUsuarioId: actor.usuarioId });
  await assertStageDocument(tx, processId, stage);
  const completedAt = new Date();
  await tx.genericProcessWorkflowInstance.update({ where: { id: instance.id }, data: { status: "CONCLUDED", dueAt: null } });
  await tx.process.update({ where: { id: processId }, data: { status: "Concluido", completedAt, expectedCompletionAt: null } });
  await tx.processEvent.create({ data: { processId, eventType: "GENERIC_WORKFLOW_CONCLUDED", description: note, previousStatus: instance.process.status, newStatus: "Concluido", departmentId: actor.departmentId, employeeId: actor.employeeId } });
  await writeAuditEvent(tx, { actorUsuarioId: actor.usuarioId, eventType: auditEventTypes.processUpdated, targetType: "PROCESS", targetId: processId });
  await tx.genericProcessWorkflowEvent.create({ data: { instanceId: instance.id, eventType: "CONCLUDED", fromPosition: transition.fromPosition, actorUsuarioId: actor.usuarioId, note } });
}
