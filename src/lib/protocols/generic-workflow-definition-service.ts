import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { assertGenericWorkflowDefinitionCanPublish } from "./generic-workflow-policy";

type Db = PrismaClient | Prisma.TransactionClient;

export const defaultGenericWorkflowTimeZone = "America/Sao_Paulo";

export async function getGenericWorkflowInstanceTimeZone(db: Db) {
  const parameter = await db.configuracaoParametroInstancia.findFirst({
    where: { chave: "WORKFLOW_INSTANCE_TIME_ZONE" },
    orderBy: { createdAt: "asc" },
    select: { valor: true },
  });
  const timeZone = typeof parameter?.valor === "string" ? parameter.valor : defaultGenericWorkflowTimeZone;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
  } catch {
    throw new Error("O fuso horario da instancia configurado para o fluxo e invalido.");
  }
  return timeZone;
}

export async function createGenericWorkflowDefinition(db: Db, processTypeId: string) {
  const processType = await db.processType.findUnique({
    where: { id: processTypeId },
    select: { id: true, genericWorkflowEnabled: true },
  });
  if (!processType?.genericWorkflowEnabled) throw new Error("Ative o fluxo generico apenas para um novo tipo de processo.");
  const latest = await db.genericProcessWorkflowDefinition.findFirst({
    where: { processTypeId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return db.genericProcessWorkflowDefinition.create({
    data: { processTypeId, version: (latest?.version ?? 0) + 1 },
    select: { id: true, version: true },
  });
}

export async function addGenericWorkflowStage(db: Db, input: {
  definitionId: string;
  position: number;
  label: string;
  departmentId: string;
  slaCalendarDays: number;
  requiresSignedDocument: boolean;
  requiredDocumentClassId: string | null;
}) {
  if (!Number.isInteger(input.position) || input.position < 1 || !Number.isInteger(input.slaCalendarDays) || input.slaCalendarDays < 1) {
    throw new Error("Informe posicao e SLA em dias corridos validos.");
  }
  if (!input.label.trim()) throw new Error("Informe o nome da etapa.");
  if (input.requiresSignedDocument && !input.requiredDocumentClassId) throw new Error("Selecione a classe do documento obrigatorio.");
  const [definition, department, documentClass] = await Promise.all([
    db.genericProcessWorkflowDefinition.findUnique({ where: { id: input.definitionId }, select: { status: true } }),
    db.department.findFirst({ where: { id: input.departmentId, isActive: true }, select: { id: true } }),
    input.requiredDocumentClassId ? db.documentClass.findFirst({ where: { id: input.requiredDocumentClassId, isActive: true }, select: { id: true } }) : null,
  ]);
  if (definition?.status !== "DRAFT") throw new Error("Somente rascunhos podem receber etapas.");
  if (!department) throw new Error("O setor da etapa precisa estar ativo.");
  if (input.requiredDocumentClassId && !documentClass) throw new Error("A classe documental obrigatoria precisa estar ativa.");
  return db.genericProcessWorkflowStage.create({ data: input });
}

export async function publishGenericWorkflowDefinition(db: Db, definitionId: string, actorUsuarioId: string) {
  const definition = await db.genericProcessWorkflowDefinition.findUnique({
    where: { id: definitionId },
    select: { status: true, stages: { select: { position: true, slaCalendarDays: true, requiresSignedDocument: true, requiredDocumentClassId: true } } },
  });
  if (!definition) throw new Error("Versao de fluxo nao encontrada.");
  assertGenericWorkflowDefinitionCanPublish(definition.status, definition.stages);
  return db.genericProcessWorkflowDefinition.update({
    where: { id: definitionId },
    data: { status: "PUBLISHED", publishedAt: new Date(), publishedByUsuarioId: actorUsuarioId },
    select: { id: true, version: true },
  });
}
