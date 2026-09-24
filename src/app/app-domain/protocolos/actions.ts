"use server";

import type { Prisma } from "@prisma/client";
import { getProtocolContext, getProtocolContextForOperation, protocolScope } from "@/lib/protocols/access";
import { notifyProtocolDepartment, notifyProtocolUsers } from "@/lib/protocols/notifications";
import { createValidatedProcess } from "@/lib/protocols/service";
import { approveGenericWorkflowProcess, concludeGenericWorkflowProcess, isGenericWorkflowProcess, recordGenericWorkflowReceipt, rejectGenericWorkflowProcess, returnGenericWorkflowProcess } from "@/lib/protocols/generic-workflow-runtime";
import { markInternalNotificationRead } from "@/lib/notifications/internal-notifications";
import { getCurrentTenantContext, getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { requestProcessDocumentSignatures } from "@/lib/documents/document-flow-service";
import { registerInternalDocumentSignature } from "@/lib/signatures/internal-signature";
import { getIdTokenPrincipal } from "@/lib/platform/session";
import { headers } from "next/headers";
import { publishProcessPublicNotice } from "@/lib/transparencia/public-notices";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";
import { assertMovementCanBeCancelled, assertMovementCanBeRejected, PENDING_MOVEMENT_STATUS } from "@/lib/protocols/movement-policy";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const AWAITING_RECEIPT = "Aguardando Recebimento";
const AWAITING_ACCOUNTING = "Aguardando Contabilidade";

async function getOperationalContext(operation: "create" | "update") {
  const context = await getProtocolContextForOperation(operation);
  if (!context.user.employeeId) {
    throw new Error("Seu usuario precisa estar vinculado a um servidor para realizar esta operacao.");
  }

  const employee = await context.prisma.employee.findUnique({
    where: { id: context.user.employeeId },
    include: { department: true },
  });

  if (!employee?.isActive || !employee.departmentId || !employee.department?.isActive) {
    throw new Error("Seu vinculo operacional nao esta ativo ou nao possui departamento.");
  }

  return { ...context, employee, departmentId: employee.departmentId };
}

function revalidateProtocolPages() {
  for (const path of [
    "/protocolos/processos",
    "/protocolos/arquivados",
    "/protocolos/busca",
    "/protocolos/notificacoes",
    "/protocolos/relatorios",
    "/app-domain/protocolos/processos",
    "/app-domain/protocolos/arquivados",
    "/app-domain/protocolos/busca",
    "/app-domain/protocolos/notificacoes",
    "/app-domain/protocolos/relatorios",
  ]) {
    revalidatePath(path);
  }
}

export async function createProtocol(formData: FormData): Promise<void> {
  const { prisma, employee, user } = await getOperationalContext("create");
  const processTypeId = String(formData.get("processTypeId") || "");
  const subjectId = String(formData.get("subjectId") || "");
  const personId = String(formData.get("personId") || "") || null;
  const companyId = String(formData.get("companyId") || "") || null;
  const selectedDepartmentId = String(formData.get("initialDepartmentId") || "") || null;
  const requestedPriority = String(formData.get("priority") || "");
  const description = String(formData.get("description") || "").trim() || null;

  if (!processTypeId || !subjectId) throw new Error("Selecione o Tipo e o Assunto do processo.");
  if (personId && companyId) throw new Error("Selecione apenas um interessado: pessoa ou empresa.");

  const process = await prisma.$transaction((tx) => createValidatedProcess(tx, employee, user.id, {
    processTypeId, subjectId, personId, companyId, initialDepartmentId: selectedDepartmentId, priority: requestedPriority, description,
  }));

  revalidateProtocolPages();
  redirect(`/protocolos/processos/${process.id}`);
}

export async function receiveProcess(processId: string): Promise<{ error: string | null }> {
  try {
    const { prisma, employee, departmentId, user } = await getOperationalContext("update");

    await prisma.$transaction(async (tx) => {
      const process = await tx.process.findUnique({
        where: { id: processId },
        select: { id: true, status: true, currentDepartmentId: true },
      });
      if (!process) throw new Error("Processo nao encontrado.");
      if (process.currentDepartmentId !== departmentId) {
        throw new Error("Este processo nao pertence ao seu setor.");
      }
      if (process.status !== AWAITING_RECEIPT) {
        throw new Error("Somente processos aguardando recebimento podem ser recebidos.");
      }

      const movement = await tx.processMovement.findFirst({
        where: {
          processId,
          toDepartmentId: departmentId,
          receivedAt: null,
          status: "AWAITING_RECEIPT",
        },
        orderBy: { movedAt: "desc" },
        select: { id: true, employeeId: true, process: { select: { protocolNumber: true } } },
      });
      if (!movement) throw new Error("Nao foi encontrada uma tramitacao pendente para este processo.");

      const receivedAt = new Date();
      const updatedMovement = await tx.processMovement.updateMany({
        where: { id: movement.id, receivedAt: null, status: "AWAITING_RECEIPT" },
        data: { status: "RECEIVED", receivedAt, receivedByEmployeeId: employee.id },
      });
      if (updatedMovement.count !== 1) throw new Error("O processo ja foi recebido por outro servidor.");

      await tx.process.update({
        where: { id: processId },
        data: { status: "Recebido", receivedAt, currentResponsibleEmployeeId: employee.id },
      });
      await tx.processEvent.create({
        data: {
          processId,
          eventType: "RECEIVED",
          description: "Processo recebido pelo setor responsavel.",
          previousStatus: AWAITING_RECEIPT,
          newStatus: "Recebido",
          departmentId,
          employeeId: employee.id,
        },
      });
      await writeAuditEvent(tx, { actorUsuarioId: user.id, eventType: auditEventTypes.processUpdated, targetType: "PROCESS", targetId: processId });
      await recordGenericWorkflowReceipt(tx, processId, user.id);
      const sender = movement.employeeId
        ? await tx.usuario.findUnique({ where: { employeeId: movement.employeeId }, select: { id: true } })
        : null;
      if (sender) {
        await notifyProtocolUsers(tx, user.id, [sender.id], {
          processId,
          type: "RECEIVED",
          title: `Processo recebido: ${movement.process.protocolNumber}`,
          message: "O setor de destino confirmou o recebimento do processo.",
          priority: "NORMAL",
          dedupeDiscriminator: movement.id,
        });
      }
    });

    revalidateProtocolPages();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Erro ao receber o processo." };
  }
}

export async function receiveProcessesBatch(processIds: string[]): Promise<{ results: Array<{ processId: string; error: string | null }> }> {
  const uniqueIds = [...new Set(processIds.filter((id) => typeof id === "string" && id.length > 0))].slice(0, 10);
  const results: Array<{ processId: string; error: string | null }> = [];

  for (const processId of uniqueIds) {
    // Each item keeps the same guarded transition as an individual receipt. A failure
    // must not roll back other independently received processes in the batch.
    const result = await receiveProcess(processId);
    results.push({ processId, error: result.error });
  }

  return { results };
}

export async function forwardProcess(data: {
  processId: string;
  destinationDepartmentId: string;
  destinationEmployeeId?: string;
  reason?: string;
  dueAt?: string;
}): Promise<{ error: string | null }> {
  try {
    const { prisma, employee, departmentId, user } = await getOperationalContext("update");
    const destinationEmployeeId = data.destinationEmployeeId || null;
    const reason = data.reason?.trim() || null;
    const dueAt = data.dueAt ? new Date(data.dueAt) : null;

    if (!data.destinationDepartmentId) throw new Error("Selecione o setor de destino.");
    if (data.destinationDepartmentId === departmentId) throw new Error("Selecione um setor diferente do atual.");
    if (dueAt && Number.isNaN(dueAt.valueOf())) throw new Error("Informe um prazo valido.");

    await prisma.$transaction(async (tx) => {
      const process = await tx.process.findUnique({
        where: { id: data.processId },
        select: {
          id: true,
          protocolNumber: true,
          status: true,
          currentDepartmentId: true,
          processTypeId: true,
          subjectId: true,
          currentWorkflowStageId: true,
          expectedCompletionAt: true,
        },
      });
      if (!process) throw new Error("Processo nao encontrado.");
      if (await isGenericWorkflowProcess(tx, data.processId)) throw new Error("Use a aprovacao ou devolucao do fluxo generico; ele nao aceita destino ou prazo manual.");
      if (process.currentDepartmentId !== departmentId) throw new Error("Este processo nao pertence ao seu setor.");
      if (["Arquivado", "Cancelado"].includes(process.status)) throw new Error("Este processo nao aceita novas operacoes.");
      if (process.status === AWAITING_RECEIPT) throw new Error("Receba o processo antes de tramita-lo.");
      if (process.status === AWAITING_ACCOUNTING) throw new Error("Aguarde a emissão do empenho para tramitar o processo.");

      const destinationDepartment = await tx.department.findFirst({
        where: { id: data.destinationDepartmentId, isActive: true },
        select: { id: true },
      });
      if (!destinationDepartment) throw new Error("O setor de destino nao esta ativo.");

      if (destinationEmployeeId) {
        const destinationEmployee = await tx.employee.findFirst({
          where: { id: destinationEmployeeId, departmentId: destinationDepartment.id, isActive: true },
          select: { id: true },
        });
        if (!destinationEmployee) throw new Error("O servidor de destino nao pertence ao setor selecionado.");
      }

      const subjectStages = await tx.processWorkflowStage.findMany({
        where: { processTypeId: process.processTypeId, subjectId: process.subjectId, isActive: true },
        orderBy: { position: "asc" },
      });
      const workflowStages = subjectStages.length
        ? subjectStages
        : await tx.processWorkflowStage.findMany({
            where: { processTypeId: process.processTypeId, subjectId: null, isActive: true },
            orderBy: { position: "asc" },
          });
      const currentStage = workflowStages.find((stage) => stage.id === process.currentWorkflowStageId)
        || workflowStages.find((stage) => stage.departmentId === departmentId)
        || null;
      const nextStage = currentStage
        ? workflowStages.find((stage) => stage.position > currentStage.position) || null
        : null;
      if (currentStage && !nextStage) throw new Error("O fluxo configurado terminou nesta etapa. Conclua o processo ou ajuste o fluxo.");
      if (nextStage && nextStage.departmentId !== destinationDepartment.id) {
        throw new Error("O setor selecionado nao corresponde a proxima etapa configurada do fluxo.");
      }
      const effectiveDueAt = dueAt || (nextStage?.slaDays ? new Date(Date.now() + nextStage.slaDays * 24 * 60 * 60 * 1000) : null);

      const movement = await tx.processMovement.create({
        data: {
          processId: process.id,
          fromDepartmentId: departmentId,
          toDepartmentId: destinationDepartment.id,
          employeeId: employee.id,
          destinationEmployeeId,
          reason,
          status: "AWAITING_RECEIPT",
          dueAt: effectiveDueAt,
        },
        select: { id: true },
      });
      await tx.process.update({
        where: { id: process.id },
        data: {
          status: AWAITING_RECEIPT,
          currentDepartmentId: destinationDepartment.id,
          currentResponsibleEmployeeId: destinationEmployeeId,
          currentWorkflowStageId: nextStage?.id || process.currentWorkflowStageId,
          expectedCompletionAt: effectiveDueAt || process.expectedCompletionAt,
        },
      });
      await tx.processEvent.create({
        data: {
          processId: process.id,
          eventType: "FORWARDED",
          description: reason || "Processo encaminhado para outro setor.",
          previousStatus: process.status,
          newStatus: AWAITING_RECEIPT,
          departmentId,
          employeeId: employee.id,
        },
      });
      await notifyProtocolDepartment(tx, user.id, destinationDepartment.id, {
        processId: process.id,
        type: "FORWARDED",
        title: `Processo encaminhado: ${process.protocolNumber}`,
        message: `O processo foi encaminhado pelo seu setor de origem${reason ? `: ${reason}` : "."}`,
        priority: "NORMAL",
        dedupeDiscriminator: movement.id,
      });
      await writeAuditEvent(tx, { actorUsuarioId: user.id, eventType: auditEventTypes.processUpdated, targetType: "PROCESS", targetId: process.id });
      if (effectiveDueAt) {
        await notifyProtocolDepartment(tx, user.id, destinationDepartment.id, {
          processId: process.id,
          type: "DEADLINE",
          title: `Prazo definido: ${process.protocolNumber}`,
          message: `Prazo da etapa: ${effectiveDueAt.toLocaleDateString("pt-BR")}.`,
          priority: "ALTA",
          dedupeDiscriminator: `DEADLINE:${effectiveDueAt.toISOString()}`,
        });
      }
    });

    revalidateProtocolPages();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Erro ao tramitar o processo." };
  }
}

async function restoreLegacyWorkflowStage(
  tx: Prisma.TransactionClient,
  process: { processTypeId: string; subjectId: string; currentWorkflowStageId: string | null },
  sourceDepartmentId: string,
) {
  const subjectStages = await tx.processWorkflowStage.findMany({
    where: { processTypeId: process.processTypeId, subjectId: process.subjectId, isActive: true },
    orderBy: { position: "asc" },
    select: { id: true, position: true, departmentId: true },
  });
  const stages = subjectStages.length
    ? subjectStages
    : await tx.processWorkflowStage.findMany({
        where: { processTypeId: process.processTypeId, subjectId: null, isActive: true },
        orderBy: { position: "asc" },
        select: { id: true, position: true, departmentId: true },
      });
  const currentStage = stages.find((stage) => stage.id === process.currentWorkflowStageId);
  if (!currentStage) return null;
  return [...stages]
    .reverse()
    .find((stage) => stage.position < currentStage.position && stage.departmentId === sourceDepartmentId)?.id || null;
}

async function reversePendingForwarding(
  movementId: string,
  reason: string,
  operation: "cancel" | "reject",
): Promise<{ error: string | null }> {
  try {
    const { prisma, employee, departmentId, user } = await getOperationalContext("update");
    const cleanReason = reason.trim();
    if (!cleanReason) throw new Error("Informe a justificativa da operação.");

    await prisma.$transaction(async (tx) => {
      const movement = await tx.processMovement.findUnique({
        where: { id: movementId },
        select: {
          id: true,
          processId: true,
          fromDepartmentId: true,
          toDepartmentId: true,
          employeeId: true,
          reason: true,
          status: true,
          receivedAt: true,
          dueAt: true,
          movedAt: true,
          process: {
            select: {
              protocolNumber: true,
              status: true,
              currentDepartmentId: true,
              processTypeId: true,
              subjectId: true,
              currentWorkflowStageId: true,
              expectedCompletionAt: true,
            },
          },
        },
      });
      if (!movement) throw new Error("Tramitação não encontrada.");

      const isGenericWorkflow = await isGenericWorkflowProcess(tx, movement.processId);
      const policyInput = {
        processStatus: movement.process.status,
        movementStatus: movement.status,
        fromDepartmentId: movement.fromDepartmentId,
        toDepartmentId: movement.toDepartmentId,
        currentDepartmentId: movement.process.currentDepartmentId,
        actorDepartmentId: departmentId,
        isGenericWorkflow,
      };
      if (operation === "cancel") assertMovementCanBeCancelled(policyInput);
      else assertMovementCanBeRejected(policyInput);

      const movementUpdate = await tx.processMovement.updateMany({
        where: { id: movement.id, status: PENDING_MOVEMENT_STATUS, receivedAt: null },
        data: {
          status: operation === "cancel" ? "CANCELLED" : "REJECTED",
          receivedByEmployeeId: operation === "reject" ? employee.id : null,
          reason: [
            movement.reason,
            operation === "cancel" ? `Encaminhamento cancelado: ${cleanReason}` : `Recebimento recusado: ${cleanReason}`,
          ].filter(Boolean).join("\n\n"),
        },
      });
      if (movementUpdate.count !== 1) {
        throw new Error("A tramitação foi atualizada por outro usuário. Atualize a tela antes de tentar novamente.");
      }

      const sourceDepartmentId = movement.fromDepartmentId!;
      const previousStageId = await restoreLegacyWorkflowStage(tx, movement.process, sourceDepartmentId);
      const previousReceivedMovement = movement.dueAt
        ? await tx.processMovement.findFirst({
            where: {
              processId: movement.processId,
              toDepartmentId: sourceDepartmentId,
              receivedAt: { not: null },
              movedAt: { lt: movement.movedAt },
            },
            orderBy: { movedAt: "desc" },
            select: { dueAt: true },
          })
        : null;
      await tx.process.update({
        where: { id: movement.processId },
        data: {
          status: "Recebido",
          currentDepartmentId: sourceDepartmentId,
          currentResponsibleEmployeeId: movement.employeeId,
          currentWorkflowStageId: previousStageId,
          // A destination deadline belongs to the pending movement. Do not leave
          // it active after cancellation/refusal, where it would create a false
          // overdue alert for the restored source sector.
          expectedCompletionAt: movement.dueAt
            ? previousReceivedMovement?.dueAt || null
            : movement.process.expectedCompletionAt,
        },
      });
      await tx.processEvent.create({
        data: {
          processId: movement.processId,
          eventType: operation === "cancel" ? "FORWARDING_CANCELLED" : "FORWARDING_REJECTED",
          description: operation === "cancel"
            ? `Encaminhamento cancelado antes do recebimento. ${cleanReason}`
            : `Recebimento recusado pelo setor de destino. ${cleanReason}`,
          previousStatus: "Aguardando Recebimento",
          newStatus: "Recebido",
          departmentId,
          employeeId: employee.id,
        },
      });
      await notifyProtocolDepartment(tx, user.id, operation === "cancel" ? movement.toDepartmentId : sourceDepartmentId, {
        processId: movement.processId,
        type: operation === "cancel" ? "FORWARDING_CANCELLED" : "FORWARDING_REJECTED",
        title: `${operation === "cancel" ? "Encaminhamento cancelado" : "Recebimento recusado"}: ${movement.process.protocolNumber}`,
        message: cleanReason,
        priority: "NORMAL",
        dedupeDiscriminator: movement.id,
      });
      await writeAuditEvent(tx, {
        actorUsuarioId: user.id,
        eventType: auditEventTypes.processUpdated,
        targetType: "PROCESS",
        targetId: movement.processId,
      });
    });

    revalidateProtocolPages();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Não foi possível atualizar a tramitação." };
  }
}

export async function cancelProcessForwarding(movementId: string, reason: string): Promise<{ error: string | null }> {
  return reversePendingForwarding(movementId, reason, "cancel");
}

export async function rejectProcessForwarding(movementId: string, reason: string): Promise<{ error: string | null }> {
  return reversePendingForwarding(movementId, reason, "reject");
}

export async function addProcessDispatch(data: {
  processId: string;
  content: string;
  dispatchType: string;
}): Promise<{ error: string | null }> {
  try {
    const { prisma, employee, departmentId, user } = await getOperationalContext("create");
    const content = data.content.trim();
    const dispatchType = ["Despacho", "Parecer", "Decisao"].includes(data.dispatchType) ? data.dispatchType : "Despacho";
    if (!content) throw new Error("Informe o conteudo do despacho.");

    await prisma.$transaction(async (tx) => {
      const process = await tx.process.findUnique({
        where: { id: data.processId },
        select: { id: true, status: true, currentDepartmentId: true },
      });
      if (!process) throw new Error("Processo nao encontrado.");
      if (process.currentDepartmentId !== departmentId) throw new Error("Este processo nao pertence ao seu setor.");
      if (["Arquivado", "Cancelado"].includes(process.status)) throw new Error("Este processo nao aceita novas operacoes.");
      if (process.status === AWAITING_RECEIPT) throw new Error("Receba o processo antes de adicionar um despacho.");

      await tx.processDispatch.create({
        data: { processId: process.id, content, dispatchType, employeeId: employee.id, departmentId },
      });
      await tx.processEvent.create({
        data: {
          processId: process.id,
          eventType: "DISPATCH_ADDED",
          description: `${dispatchType} adicionado ao processo.`,
          departmentId,
          employeeId: employee.id,
        },
      });
      await writeAuditEvent(tx, { actorUsuarioId: user.id, eventType: auditEventTypes.processUpdated, targetType: "PROCESS", targetId: process.id });
    });

    revalidateProtocolPages();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Erro ao adicionar o despacho." };
  }
}

export async function concludeProcess(processId: string, reason: string): Promise<{ error: string | null }> {
  try {
    const { prisma, employee, departmentId, user } = await getOperationalContext("update");
    const description = reason.trim();
    if (!description) throw new Error("Informe a justificativa da conclusao.");

    await prisma.$transaction(async (tx) => {
      if (await isGenericWorkflowProcess(tx, processId)) throw new Error("Use a conclusao da etapa final do fluxo generico.");
      const process = await tx.process.findUnique({ where: { id: processId }, select: { status: true, currentDepartmentId: true } });
      if (!process) throw new Error("Processo nao encontrado.");
      if (process.currentDepartmentId !== departmentId) throw new Error("Este processo nao pertence ao seu setor.");
      if (process.status === AWAITING_RECEIPT) throw new Error("Receba o processo antes de conclui-lo.");
      if (process.status === AWAITING_ACCOUNTING) throw new Error("Aguarde a emissão do empenho para concluir o processo.");
      if (["Concluido", "Arquivado", "Cancelado"].includes(process.status)) throw new Error("Este processo nao pode ser concluido novamente.");

      const completedAt = new Date();
      await tx.process.update({ where: { id: processId }, data: { status: "Concluido", completedAt } });
      await tx.processEvent.create({
        data: { processId, eventType: "CONCLUDED", description, previousStatus: process.status, newStatus: "Concluido", departmentId, employeeId: employee.id },
      });
      await writeAuditEvent(tx, { actorUsuarioId: user.id, eventType: auditEventTypes.processUpdated, targetType: "PROCESS", targetId: processId });
    });
    revalidateProtocolPages();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Erro ao concluir o processo." };
  }
}

export async function approveGenericProcessWorkflow(processId: string, note: string): Promise<{ error: string | null }> {
  try {
    const { prisma, employee, departmentId, user } = await getOperationalContext("update");
    await prisma.$transaction((tx) => approveGenericWorkflowProcess(tx, processId, { usuarioId: user.id, employeeId: employee.id, departmentId }, note.trim() || null));
    revalidateProtocolPages();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Erro ao aprovar a etapa do fluxo." };
  }
}

export async function returnGenericProcessWorkflow(processId: string, reason: string): Promise<{ error: string | null }> {
  try {
    const { prisma, employee, departmentId, user } = await getOperationalContext("update");
    const note = reason.trim();
    if (!note) throw new Error("Informe o motivo da devolucao.");
    await prisma.$transaction((tx) => returnGenericWorkflowProcess(tx, processId, { usuarioId: user.id, employeeId: employee.id, departmentId }, note));
    revalidateProtocolPages();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Erro ao devolver a etapa do fluxo." };
  }
}

export async function rejectGenericProcessWorkflow(processId: string, reason: string): Promise<{ error: string | null }> {
  try {
    const { prisma, employee, departmentId, user } = await getOperationalContext("update");
    const note = reason.trim();
    if (!note) throw new Error("Informe o motivo da rejeicao.");
    await prisma.$transaction((tx) => rejectGenericWorkflowProcess(tx, processId, { usuarioId: user.id, employeeId: employee.id, departmentId }, note));
    revalidateProtocolPages();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Erro ao rejeitar o processo." };
  }
}

export async function concludeGenericProcessWorkflow(processId: string, reason: string): Promise<{ error: string | null }> {
  try {
    const { prisma, employee, departmentId, user } = await getOperationalContext("update");
    const note = reason.trim();
    if (!note) throw new Error("Informe a justificativa da conclusao.");
    await prisma.$transaction((tx) => concludeGenericWorkflowProcess(tx, processId, { usuarioId: user.id, employeeId: employee.id, departmentId }, note));
    revalidateProtocolPages();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Erro ao concluir o processo." };
  }
}

export async function archiveProcess(processId: string, reason: string): Promise<{ error: string | null }> {
  try {
    const { prisma, employee, departmentId, user } = await getOperationalContext("update");
    const archiveReason = reason.trim();
    if (!archiveReason) throw new Error("Informe a justificativa do arquivamento.");

    await prisma.$transaction(async (tx) => {
      if (await isGenericWorkflowProcess(tx, processId)) throw new Error("Processos do fluxo generico nao usam arquivamento manual.");
      const process = await tx.process.findUnique({ where: { id: processId }, select: { status: true, currentDepartmentId: true } });
      if (!process) throw new Error("Processo nao encontrado.");
      if (process.currentDepartmentId !== departmentId) throw new Error("Este processo nao pertence ao seu setor.");
      if (process.status !== "Concluido") throw new Error("Somente processos concluidos podem ser arquivados.");

      const archivedAt = new Date();
      await tx.process.update({
        where: { id: processId },
        data: { status: "Arquivado", archivedAt, archiveReason, archivedByEmployeeId: employee.id },
      });
      await tx.processEvent.create({
        data: { processId, eventType: "ARCHIVED", description: archiveReason, previousStatus: "Concluido", newStatus: "Arquivado", departmentId, employeeId: employee.id },
      });
      await writeAuditEvent(tx, { actorUsuarioId: user.id, eventType: auditEventTypes.processUpdated, targetType: "PROCESS", targetId: processId });
    });
    revalidateProtocolPages();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Erro ao arquivar o processo." };
  }
}

export async function reopenProcess(processId: string, reason: string): Promise<{ error: string | null }> {
  try {
    const { prisma, employee, departmentId, user } = await getOperationalContext("update");
    const description = reason.trim();
    if (!description) throw new Error("Informe a justificativa da reabertura.");

    await prisma.$transaction(async (tx) => {
      if (await isGenericWorkflowProcess(tx, processId)) throw new Error("Processos do fluxo generico nao podem ser reabertos.");
      const process = await tx.process.findUnique({ where: { id: processId }, select: { status: true, currentDepartmentId: true } });
      if (!process) throw new Error("Processo nao encontrado.");
      if (process.currentDepartmentId !== departmentId) throw new Error("Este processo nao pertence ao seu setor.");
      if (process.status !== "Arquivado") throw new Error("Somente processos arquivados podem ser reabertos.");

      await tx.process.update({
        where: { id: processId },
        data: { status: "Reaberto", archivedAt: null, archiveReason: null, archivedByEmployeeId: null, currentResponsibleEmployeeId: employee.id },
      });
      await tx.processEvent.create({
        data: { processId, eventType: "REOPENED", description, previousStatus: "Arquivado", newStatus: "Reaberto", departmentId, employeeId: employee.id },
      });
      await writeAuditEvent(tx, { actorUsuarioId: user.id, eventType: auditEventTypes.processUpdated, targetType: "PROCESS", targetId: processId });
    });
    revalidateProtocolPages();
    return { error: null };
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Erro ao reabrir o processo." };
  }
}

export async function markProtocolNotificationRead(notificationId: string): Promise<{ error: string | null }> {
  try {
    const { prisma, user } = await getCurrentTenantContext();
    const marked = await prisma.$transaction((tx) => markInternalNotificationRead(tx, notificationId, user.id));
    if (!marked) throw new Error("Notificacao nao encontrada ou ja lida.");
    revalidatePath("/protocolos/notificacoes");
    revalidatePath("/notificacoes");
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao atualizar notificacao." };
  }
}

export async function requestProcessSignatures(data: {
  processId: string;
  documentId: string;
  signerUsuarioIds: string[];
}): Promise<{ error: string | null }> {
  try {
    const context = await getOperationalContext("create");
    await requestProcessDocumentSignatures(context, {
      processId: data.processId,
      documentId: data.documentId,
      signerUsuarioIds: data.signerUsuarioIds,
      employeeId: context.employee.id,
      departmentId: context.departmentId,
    });
    revalidateProtocolPages();
    revalidatePath("/protocolos/assinaturas");
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nao foi possivel solicitar as assinaturas." };
  }
}

export async function signProcessDocumentInternally(documentId: string, reauthenticationToken: string): Promise<{ error: string | null }> {
  try {
    if (!reauthenticationToken) throw new Error("Confirme sua senha para assinar o documento.");
    const context = await getProtocolContext();
    const reauthenticatedUser = await getIdTokenPrincipal(reauthenticationToken);
    if (!reauthenticatedUser || reauthenticatedUser.firebaseUid !== context.user.firebaseUid) {
      throw new Error("A reautenticacao nao corresponde ao usuario da sessao atual.");
    }
    if (Date.now() - reauthenticatedUser.authTime * 1000 > 5 * 60 * 1000) {
      throw new Error("A confirmacao de senha expirou. Informe sua senha novamente.");
    }
    const scopedPendingSignature = await context.prisma.processDocument.findFirst({
      where: {
        documentId,
        process: { is: protocolScope(context) },
        document: { signatures: { some: { signerUsuarioId: context.user.id, status: "PENDING", documentVersion: { status: "PENDING_SIGNATURE" } } } },
      },
      select: { id: true },
    });
    if (!scopedPendingSignature) throw new Error("Nenhuma assinatura pendente deste processo foi encontrada para voce.");
    const requestHeaders = await headers();
    await registerInternalDocumentSignature(context, documentId, {
      ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: requestHeaders.get("user-agent"),
    }, new Date());
    revalidateProtocolPages();
    revalidatePath("/protocolos/assinaturas");
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nao foi possivel registrar a assinatura interna." };
  }
}

export async function publishProcessNotice(processId: string): Promise<{ error: string | null }> {
  try {
    const context = await getTenantContextForSystemAdministration();
    await publishProcessPublicNotice(context.prisma, context.user.id, processId);
    revalidatePath("/portal-transparencia");
    revalidatePath("/portal-protocolos");
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nao foi possivel publicar o aviso." };
  }
}
