import type { Prisma } from "@prisma/client";
import { getGenericWorkflowInstanceTimeZone } from "@/lib/protocols/generic-workflow-definition-service";
import { calculateGenericWorkflowDeadline } from "@/lib/protocols/generic-workflow-policy";
import { notifyProtocolDepartment } from "@/lib/protocols/notifications";
import { auditEventTypes, writeAuditEvent } from "@/lib/platform/audit-evidence";

const AWAITING_RECEIPT = "Aguardando Recebimento";

export type ProcessOpeningInput = {
  processTypeId: string;
  subjectId: string;
  personId?: string | null;
  companyId?: string | null;
  initialDepartmentId?: string | null;
  priority?: string | null;
  description?: string | null;
};

type OperationalEmployee = { id: string };

// This is the only process-opening path used by Protocols and its integrations.
export async function createValidatedProcess(tx: Prisma.TransactionClient, employee: OperationalEmployee, actorUsuarioId: string, input: ProcessOpeningInput) {
  const { processTypeId, subjectId, personId = null, companyId = null, initialDepartmentId: selectedDepartmentId = null, priority: requestedPriority = null, description = null } = input;
  if (!processTypeId || !subjectId) throw new Error("Selecione o Tipo e o Assunto do processo.");
  if (personId && companyId) throw new Error("Selecione apenas um interessado: pessoa ou empresa.");

  const subject = await tx.subject.findFirst({
    where: { id: subjectId, processTypeId, isActive: true },
    include: { processType: true },
  });
  if (!subject || !subject.processType.isActive) throw new Error("O Assunto selecionado nao pertence a um Tipo de Processo ativo.");
  if (!subject.allowsInternalOpening || !subject.processType.allowsInternalOpening) throw new Error("Este processo nao permite abertura interna.");
  if ((subject.requiresInterested || subject.processType.requiresInterested) && !personId && !companyId) {
    throw new Error("Este processo exige a selecao de um interessado.");
  }

  const genericDefinition = subject.processType.genericWorkflowEnabled
    ? await tx.genericProcessWorkflowDefinition.findFirst({
      where: { processTypeId, status: "PUBLISHED" },
      orderBy: { version: "desc" },
      include: { stages: { orderBy: { position: "asc" } } },
    })
    : null;
  if (subject.processType.genericWorkflowEnabled && !genericDefinition) {
    throw new Error("Este tipo usa o fluxo generico e precisa de uma versao publicada antes da abertura.");
  }
  if (genericDefinition && selectedDepartmentId) {
    throw new Error("O setor inicial do fluxo generico e definido pela versao publicada.");
  }
  const subjectStages = genericDefinition ? [] : await tx.processWorkflowStage.findMany({ where: { processTypeId, subjectId, isActive: true }, orderBy: { position: "asc" } });
  const workflowStages = genericDefinition || subjectStages.length
    ? subjectStages
    : await tx.processWorkflowStage.findMany({ where: { processTypeId, subjectId: null, isActive: true }, orderBy: { position: "asc" } });
  const initialStage = workflowStages[0] || null;
  const initialGenericStage = genericDefinition?.stages[0] || null;
  const initialDepartmentId = initialGenericStage?.departmentId || initialStage?.departmentId || subject.initialDepartmentId || subject.processType.initialDepartmentId || selectedDepartmentId;
  if (!initialDepartmentId) throw new Error("Selecione o setor inicial responsavel pelo processo.");

  const department = await tx.department.findFirst({ where: { id: initialDepartmentId, isActive: true }, select: { id: true } });
  if (!department) throw new Error("O setor inicial selecionado nao esta ativo.");

  const year = new Date().getFullYear();
  const sequence = await tx.processSequence.upsert({
    where: { year }, create: { year, nextNumber: 2 }, update: { nextNumber: { increment: 1 } }, select: { nextNumber: true },
  });
  const protocolNumber = `PROC-${year}-${String(sequence.nextNumber - 1).padStart(6, "0")}`;
  const instanceTimeZone = genericDefinition ? await getGenericWorkflowInstanceTimeZone(tx) : null;
  const slaDays = initialStage?.slaDays ?? subject.slaDays ?? subject.processType.defaultSlaDays;
  const expectedCompletionAt = initialGenericStage && instanceTimeZone
    ? calculateGenericWorkflowDeadline(new Date(), initialGenericStage.slaCalendarDays, instanceTimeZone)
    : slaDays ? new Date(Date.now() + slaDays * 86_400_000) : null;
  const priority = requestedPriority || subject.defaultPriority || subject.processType.defaultPriority || "Normal";
  const process = await tx.process.create({
    data: {
      protocolNumber, personId, companyId, processTypeId, subjectId, priority, description,
      status: AWAITING_RECEIPT, currentDepartmentId: department.id, currentWorkflowStageId: initialStage?.id || null, expectedCompletionAt,
      movements: { create: { toDepartmentId: department.id, employeeId: employee.id, reason: "Distribuicao inicial", status: "AWAITING_RECEIPT", dueAt: expectedCompletionAt } },
      events: { create: { eventType: "OPENED", description: "Processo protocolado e encaminhado ao setor inicial.", newStatus: AWAITING_RECEIPT, departmentId: department.id, employeeId: employee.id } },
      ...(genericDefinition && initialGenericStage && instanceTimeZone ? {
        genericWorkflowInstance: {
          create: {
            definitionId: genericDefinition.id,
            definitionVersion: genericDefinition.version,
            currentPosition: initialGenericStage.position,
            dueAt: expectedCompletionAt,
            instanceTimeZone,
            openedByUsuarioId: actorUsuarioId,
            events: { create: { eventType: "OPENED", toPosition: initialGenericStage.position, actorUsuarioId } },
          },
        },
      } : {}),
    },
    select: { id: true, protocolNumber: true, expectedCompletionAt: true },
  });
  await notifyProtocolDepartment(tx, actorUsuarioId, department.id, {
    processId: process.id, type: "RECEIVE", title: `Novo processo ${process.protocolNumber}`, message: "Um processo aguarda recebimento no seu setor.", priority: "NORMAL", dedupeDiscriminator: "OPENED",
  });
  await writeAuditEvent(tx, {
    actorUsuarioId,
    eventType: auditEventTypes.processOpened,
    targetType: "PROCESS",
    targetId: process.id,
  });
  if (process.expectedCompletionAt) {
    await notifyProtocolDepartment(tx, actorUsuarioId, department.id, {
      processId: process.id, type: "DEADLINE", title: `Prazo definido: ${process.protocolNumber}`,
      message: `Prazo da etapa: ${process.expectedCompletionAt.toLocaleDateString("pt-BR")}.`, priority: "ALTA", dedupeDiscriminator: `DEADLINE:${process.expectedCompletionAt.toISOString()}`,
    });
  }
  return process;
}
