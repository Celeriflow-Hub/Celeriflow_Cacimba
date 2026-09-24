"use server";

import { revalidatePath } from "next/cache";
import { getTenantContextForSystemAdministration } from "@/lib/platform/tenant-context";
import { addGenericWorkflowStage, createGenericWorkflowDefinition, publishGenericWorkflowDefinition } from "@/lib/protocols/generic-workflow-definition-service";

async function getConfigurationPrisma() {
  return (await getTenantContextForSystemAdministration()).prisma;
}

function optionalId(formData: FormData, name: string) {
  return String(formData.get(name) || "") || null;
}

export async function saveProcessType(formData: FormData): Promise<void> {
  const id = optionalId(formData, "id");
  const prisma = await getConfigurationPrisma();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do Tipo de Processo.");

  const genericWorkflowEnabled = formData.get("genericWorkflowEnabled") === "on";
  const data = {
    name,
    description: String(formData.get("description") || "").trim() || null,
    initialDepartmentId: optionalId(formData, "initialDepartmentId"),
    defaultSlaDays: Number(formData.get("defaultSlaDays") || "") || null,
    defaultPriority: optionalId(formData, "defaultPriority"),
    requiresInterested: formData.get("requiresInterested") === "on",
    allowsInternalOpening: formData.get("allowsInternalOpening") === "on",
    genericWorkflowEnabled,
    isActive: formData.get("isActive") === "on",
  };

  if (id) {
    const existing = await prisma.processType.findUnique({ where: { id }, select: { genericWorkflowEnabled: true, _count: { select: { processes: true } } } });
    if (!existing) throw new Error("Tipo de Processo nao encontrado.");
    if (genericWorkflowEnabled && !existing.genericWorkflowEnabled && existing._count.processes > 0) {
      throw new Error("O fluxo generico so pode ser ativado em novos tipos, sem processos existentes.");
    }
    await prisma.processType.update({ where: { id }, data });
  }
  else await prisma.processType.create({ data });
  revalidatePath("/configuracoes/processos");
}

export async function saveSubject(formData: FormData): Promise<void> {
  const id = optionalId(formData, "id");
  const prisma = await getConfigurationPrisma();
  const name = String(formData.get("name") || "").trim();
  const processTypeId = String(formData.get("processTypeId") || "");
  if (!name || !processTypeId) throw new Error("Informe o Assunto e o Tipo de Processo.");

  const existing = id ? await prisma.subject.findUnique({ where: { id }, select: { initialDepartmentId: true, slaDays: true, defaultPriority: true, requiresInterested: true, allowsInternalOpening: true, isActive: true } }) : null;
  if (id && !existing) throw new Error("Assunto nao encontrado.");
  const data = {
    name,
    description: String(formData.get("description") || "").trim() || null,
    processTypeId,
    initialDepartmentId: formData.has("initialDepartmentId") ? optionalId(formData, "initialDepartmentId") : existing?.initialDepartmentId ?? null,
    slaDays: formData.has("slaDays") ? Number(formData.get("slaDays") || "") || null : existing?.slaDays ?? null,
    defaultPriority: formData.has("defaultPriority") ? optionalId(formData, "defaultPriority") : existing?.defaultPriority ?? null,
    requiresInterested: formData.has("requiresInterested") ? formData.get("requiresInterested") === "on" : existing?.requiresInterested ?? false,
    allowsInternalOpening: formData.has("allowsInternalOpening") ? formData.get("allowsInternalOpening") === "on" : existing?.allowsInternalOpening ?? true,
    isActive: formData.has("isActive") ? formData.get("isActive") === "on" : existing?.isActive ?? true,
  };

  if (id) await prisma.subject.update({ where: { id }, data });
  else await prisma.subject.create({ data });
  revalidatePath("/configuracoes/processos");
}

export async function saveProcessWorkflowStage(formData: FormData): Promise<void> {
  const id = optionalId(formData, "id");
  const prisma = await getConfigurationPrisma();
  const processTypeId = String(formData.get("processTypeId") || "");
  const subjectId = optionalId(formData, "subjectId");
  const departmentId = String(formData.get("departmentId") || "");
  const position = Number(formData.get("position") || "");
  const slaDays = Number(formData.get("slaDays") || "") || null;
  if (!processTypeId || !departmentId || !Number.isInteger(position) || position < 1) {
    throw new Error("Informe tipo, setor e uma ordem de etapa valida.");
  }
  if (subjectId) {
    const subject = await prisma.subject.findFirst({ where: { id: subjectId, processTypeId }, select: { id: true } });
    if (!subject) throw new Error("O Assunto selecionado nao pertence ao Tipo de Processo.");
  }
  const data = {
    processTypeId,
    subjectId,
    departmentId,
    position,
    slaDays,
    label: String(formData.get("label") || "").trim() || null,
    isActive: formData.get("isActive") === "on",
  };
  if (id) await prisma.processWorkflowStage.update({ where: { id }, data });
  else await prisma.processWorkflowStage.create({ data });
  revalidatePath("/configuracoes/processos");
}

export async function deleteProcessWorkflowStage(formData: FormData): Promise<void> {
  const prisma = await getConfigurationPrisma();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Etapa nao informada.");
  await prisma.processWorkflowStage.delete({ where: { id } });
  revalidatePath("/configuracoes/processos");
}

export async function createGenericWorkflowDefinitionAction(formData: FormData): Promise<void> {
  const prisma = await getConfigurationPrisma();
  const processTypeId = String(formData.get("processTypeId") || "");
  if (!processTypeId) throw new Error("Selecione um Tipo de Processo opt-in.");
  await prisma.$transaction((tx) => createGenericWorkflowDefinition(tx, processTypeId));
  revalidatePath("/configuracoes/processos");
}

export async function addGenericWorkflowStageAction(formData: FormData): Promise<void> {
  const prisma = await getConfigurationPrisma();
  const definitionId = String(formData.get("definitionId") || "");
  const position = Number(formData.get("position") || "");
  const slaCalendarDays = Number(formData.get("slaCalendarDays") || "");
  await prisma.$transaction((tx) => addGenericWorkflowStage(tx, {
    definitionId,
    position,
    label: String(formData.get("label") || "").trim(),
    departmentId: String(formData.get("departmentId") || ""),
    slaCalendarDays,
    requiresSignedDocument: formData.get("requiresSignedDocument") === "on",
    requiredDocumentClassId: optionalId(formData, "requiredDocumentClassId"),
  }));
  revalidatePath("/configuracoes/processos");
}

export async function deleteGenericWorkflowStageAction(formData: FormData): Promise<void> {
  const prisma = await getConfigurationPrisma();
  const id = String(formData.get("id") || "");
  const stage = await prisma.genericProcessWorkflowStage.findUnique({ where: { id }, select: { definition: { select: { status: true } } } });
  if (!stage || stage.definition.status !== "DRAFT") throw new Error("Somente etapas de rascunho podem ser excluidas.");
  await prisma.genericProcessWorkflowStage.delete({ where: { id } });
  revalidatePath("/configuracoes/processos");
}

export async function publishGenericWorkflowDefinitionAction(formData: FormData): Promise<void> {
  const prisma = await getConfigurationPrisma();
  const definitionId = String(formData.get("definitionId") || "");
  const context = await getTenantContextForSystemAdministration();
  await prisma.$transaction((tx) => publishGenericWorkflowDefinition(tx, definitionId, context.user.id));
  revalidatePath("/configuracoes/processos");
}
