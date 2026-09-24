"use server";

import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { z } from "zod";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("SANEAMENTO", operation)).prisma;
}

type ActionResult = { error?: string };

const unitCategories = ["Residencial", "Comercial", "Industrial", "Pública", "Rural"] as const;
const unitStatuses = ["Ativa", "Inativa"] as const;
const readingStatuses = ["Registrada", "Revisada", "Estimada"] as const;
const orderTypes = ["Vazamento", "Religação", "Corte", "Manutenção", "Troca de Hidrômetro"] as const;
const orderPriorities = ["Normal", "Alta", "Urgente"] as const;
const orderStatuses = ["Aberta", "Em Andamento", "Concluída", "Cancelada"] as const;
const complianceStatuses = ["Conforme", "Não Conforme"] as const;

const requiredText = z.string().trim().min(1, "Campo obrigatório.");
const competence = z.string().regex(/^(0[1-9]|1[0-2])\/\d{4}$/, "Informe a competência no formato MM/AAAA.");
const meterValue = z.number().finite().min(0, "A leitura deve ser maior ou igual a zero.");
const inputDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.").transform((value) => new Date(`${value}T12:00:00.000Z`));

function databaseErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "Já existe um registro com esses dados.";
  }

  return fallback;
}

function revalidateOperationalPaths(path: string) {
  revalidatePath(path);
  revalidatePath("/saneamento");
}

// --- Unidades Consumidoras ---
export async function createConsumerUnit(data: {
  code: string;
  address: string;
  category: string;
  ownerName: string;
  ownerDocument: string;
}): Promise<ActionResult> {
  const prisma = await getTenantPrisma("create");
  const parsed = z.object({
    code: requiredText,
    address: requiredText,
    category: z.enum(unitCategories),
    ownerName: requiredText,
    ownerDocument: requiredText,
  }).safeParse(data);

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.sanConsumerUnit.create({ data: { ...parsed.data, status: "Ativa" } });
  } catch (error) {
    return { error: databaseErrorMessage(error, "Não foi possível cadastrar a unidade consumidora.") };
  }

  revalidateOperationalPaths("/saneamento/unidades");
  return {};
}

export async function updateConsumerUnit(
  id: string,
  data: {
    code?: string;
    address?: string;
    category?: string;
    ownerName?: string;
    ownerDocument?: string;
    status: string;
  }
): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  const parsed = z.object({
    id: requiredText,
    code: requiredText,
    address: requiredText,
    category: z.enum(unitCategories),
    ownerName: requiredText,
    ownerDocument: requiredText.optional(),
    status: z.enum(unitStatuses),
  }).safeParse({ id, ...data });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.sanConsumerUnit.update({
      where: { id: parsed.data.id },
      data: {
        code: parsed.data.code,
        address: parsed.data.address,
        category: parsed.data.category,
        ownerName: parsed.data.ownerName,
        status: parsed.data.status,
        ...(parsed.data.ownerDocument ? { ownerDocument: parsed.data.ownerDocument } : {}),
      },
    });
  } catch (error) {
    return { error: databaseErrorMessage(error, "Não foi possível atualizar a unidade consumidora.") };
  }

  revalidateOperationalPaths("/saneamento/unidades");
  return {};
}

export async function inactivateConsumerUnit(id: string): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  if (!requiredText.safeParse(id).success) return { error: "Unidade inválida." };

  try {
    await prisma.sanConsumerUnit.update({ where: { id }, data: { status: "Inativa" } });
  } catch (error) {
    return { error: databaseErrorMessage(error, "Não foi possível inativar a unidade consumidora.") };
  }

  revalidateOperationalPaths("/saneamento/unidades");
  return {};
}

// --- Leituras ---
export async function createMeterReading(data: {
  unitId: string;
  competence: string;
  previousValue: number;
  currentValue: number;
  readerName: string;
}): Promise<ActionResult> {
  const prisma = await getTenantPrisma("create");
  const parsed = z.object({
    unitId: requiredText,
    competence,
    previousValue: meterValue,
    currentValue: meterValue,
    readerName: requiredText,
  }).safeParse(data);

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.currentValue < parsed.data.previousValue) {
    return { error: "A leitura atual não pode ser menor que a leitura anterior." };
  }

  const unit = await prisma.sanConsumerUnit.findUnique({
    where: { id: parsed.data.unitId },
    select: { status: true },
  });
  if (!unit) return { error: "Unidade consumidora não encontrada." };
  if (unit.status !== "Ativa") return { error: "Só é possível registrar leituras para unidades ativas." };

  try {
    await prisma.sanMeterReading.create({
      data: {
        ...parsed.data,
        consumption: parsed.data.currentValue - parsed.data.previousValue,
        status: "Registrada",
      },
    });
  } catch (error) {
    return { error: databaseErrorMessage(error, "Não foi possível registrar a leitura.") };
  }

  revalidateOperationalPaths("/saneamento/leituras");
  return {};
}

export async function updateMeterReading(
  id: string,
  data: { currentValue?: number; status?: string; readerName?: string }
): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  const parsed = z.object({
    id: requiredText,
    currentValue: meterValue,
    status: z.enum(readingStatuses),
    readerName: requiredText,
  }).safeParse({ id, ...data });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const reading = await prisma.sanMeterReading.findUnique({
    where: { id: parsed.data.id },
    select: { previousValue: true },
  });
  if (!reading) return { error: "Leitura não encontrada." };
  if (parsed.data.currentValue < reading.previousValue) {
    return { error: "A leitura atual não pode ser menor que a leitura anterior." };
  }

  try {
    await prisma.sanMeterReading.update({
      where: { id: parsed.data.id },
      data: {
        currentValue: parsed.data.currentValue,
        consumption: parsed.data.currentValue - reading.previousValue,
        status: parsed.data.status,
        readerName: parsed.data.readerName,
      },
    });
  } catch (error) {
    return { error: databaseErrorMessage(error, "Não foi possível atualizar a leitura.") };
  }

  revalidateOperationalPaths("/saneamento/leituras");
  return {};
}

// --- Ordens de Serviço ---
export async function createServiceOrder(data: {
  orderType: string;
  description: string;
  priority: string;
  unitId?: string;
  technician?: string;
}): Promise<ActionResult> {
  const prisma = await getTenantPrisma("create");
  const parsed = z.object({
    orderType: z.enum(orderTypes),
    description: requiredText,
    priority: z.enum(orderPriorities),
    unitId: z.string().trim().optional(),
    technician: z.string().trim().optional(),
  }).safeParse(data);

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const unitId = parsed.data.unitId || null;
  if (["Corte", "Religação"].includes(parsed.data.orderType) && !unitId) {
    return { error: "Corte e religação exigem uma unidade consumidora." };
  }
  if (unitId && !(await prisma.sanConsumerUnit.findUnique({ where: { id: unitId }, select: { id: true } }))) {
    return { error: "Unidade consumidora não encontrada." };
  }

  const orderNumber = `OS-${new Date().getFullYear()}-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  try {
    await prisma.sanServiceOrder.create({
      data: {
        orderNumber,
        orderType: parsed.data.orderType,
        description: parsed.data.description,
        priority: parsed.data.priority,
        unitId,
        technician: parsed.data.technician || null,
        status: "Aberta",
      },
    });
  } catch (error) {
    return { error: databaseErrorMessage(error, "Não foi possível abrir a ordem de serviço.") };
  }

  revalidateOperationalPaths("/saneamento/servicos");
  return {};
}

export async function updateServiceOrder(
  id: string,
  data: {
    orderType?: string;
    description?: string;
    priority?: string;
    status?: string;
    technician?: string;
  }
): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  const parsed = z.object({
    id: requiredText,
    orderType: z.enum(orderTypes),
    description: requiredText,
    priority: z.enum(orderPriorities),
    status: z.enum(orderStatuses),
    technician: z.string().trim().optional(),
  }).safeParse({ id, ...data });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const order = await prisma.sanServiceOrder.findUnique({
    where: { id: parsed.data.id },
    select: { status: true, orderType: true, unitId: true },
  });
  if (!order) return { error: "Ordem de serviço não encontrada." };
  if (["Concluída", "Cancelada"].includes(order.status)) {
    return { error: "Ordens concluídas ou canceladas não podem ser reabertas ou alteradas." };
  }

  const allowedTransitions: Record<string, string[]> = {
    Aberta: ["Aberta", "Em Andamento", "Cancelada"],
    "Em Andamento": ["Em Andamento", "Concluída", "Cancelada"],
  };
  if (!allowedTransitions[order.status].includes(parsed.data.status)) {
    return { error: "Transição de status da ordem de serviço não permitida." };
  }
  if (["Corte", "Religação"].includes(parsed.data.orderType) && !order.unitId) {
    return { error: "Corte e religação exigem uma unidade consumidora." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.sanServiceOrder.update({
        where: { id: parsed.data.id },
        data: {
          orderType: parsed.data.orderType,
          description: parsed.data.description,
          priority: parsed.data.priority,
          status: parsed.data.status,
          technician: parsed.data.technician || null,
        },
      });

      if (parsed.data.status === "Concluída" && order.unitId) {
        const unitStatus = parsed.data.orderType === "Corte"
          ? "Cortada"
          : parsed.data.orderType === "Religação"
            ? "Ativa"
            : null;
        if (unitStatus) await tx.sanConsumerUnit.update({ where: { id: order.unitId }, data: { status: unitStatus } });
      }
    });
  } catch (error) {
    return { error: databaseErrorMessage(error, "Não foi possível atualizar a ordem de serviço.") };
  }

  revalidateOperationalPaths("/saneamento/servicos");
  revalidatePath("/saneamento/unidades");
  return {};
}

// --- Qualidade, Portal e Relatórios ---
export async function updateWaterQualityAnalysis(
  id: string,
  data: { collectionPoint: string; collectedAt: string; parameter: string; result: string; limit: string; compliance: string }
): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  const parsed = z.object({ id: requiredText, collectionPoint: requiredText, collectedAt: inputDate, parameter: requiredText, result: requiredText, limit: requiredText, compliance: z.enum(complianceStatuses) }).safeParse({ id, ...data });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.sanWaterQualityAnalysis.update({ where: { id: parsed.data.id }, data: { collectionPoint: parsed.data.collectionPoint, collectedAt: parsed.data.collectedAt, parameter: parsed.data.parameter, result: parsed.data.result, limit: parsed.data.limit, compliance: parsed.data.compliance } });
  } catch (error) {
    return { error: databaseErrorMessage(error, "Não foi possível atualizar a análise.") };
  }

  revalidateOperationalPaths("/saneamento/qualidade");
  return {};
}

export async function inactivateWaterQualityAnalysis(id: string): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  if (!requiredText.safeParse(id).success) return { error: "Análise inválida." };
  try {
    await prisma.sanWaterQualityAnalysis.update({ where: { id }, data: { active: false } });
  } catch (error) {
    return { error: databaseErrorMessage(error, "Não foi possível inativar a análise.") };
  }
  revalidateOperationalPaths("/saneamento/qualidade");
  return {};
}

export async function updatePortalRequest(
  id: string,
  data: { requestType: string; requesterName: string; requestedAt: string; source: string; status: string }
): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  const parsed = z.object({ id: requiredText, requestType: requiredText, requesterName: requiredText, requestedAt: inputDate, source: requiredText, status: requiredText }).safeParse({ id, ...data });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.sanPortalRequest.update({ where: { id: parsed.data.id }, data: { requestType: parsed.data.requestType, requesterName: parsed.data.requesterName, requestedAt: parsed.data.requestedAt, source: parsed.data.source, status: parsed.data.status } });
  } catch (error) {
    return { error: databaseErrorMessage(error, "Não foi possível atualizar a solicitação.") };
  }

  revalidateOperationalPaths("/saneamento/portal");
  return {};
}

export async function inactivatePortalRequest(id: string): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  if (!requiredText.safeParse(id).success) return { error: "Solicitação inválida." };
  try {
    await prisma.sanPortalRequest.update({ where: { id }, data: { active: false } });
  } catch (error) {
    return { error: databaseErrorMessage(error, "Não foi possível inativar a solicitação.") };
  }
  revalidateOperationalPaths("/saneamento/portal");
  return {};
}

export async function updateSavedReport(
  id: string,
  data: { name: string; type: string; period: string; format: string }
): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  const parsed = z.object({ id: requiredText, name: requiredText, type: requiredText, period: requiredText, format: requiredText }).safeParse({ id, ...data });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.sanSavedReport.update({ where: { id: parsed.data.id }, data: { name: parsed.data.name, type: parsed.data.type, period: parsed.data.period, format: parsed.data.format } });
  } catch (error) {
    return { error: databaseErrorMessage(error, "Não foi possível atualizar o relatório.") };
  }

  revalidateOperationalPaths("/saneamento/relatorios");
  return {};
}

export async function inactivateSavedReport(id: string): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  if (!requiredText.safeParse(id).success) return { error: "Relatório inválido." };
  try {
    await prisma.sanSavedReport.update({ where: { id }, data: { active: false } });
  } catch (error) {
    return { error: databaseErrorMessage(error, "Não foi possível inativar o relatório.") };
  }
  revalidateOperationalPaths("/saneamento/relatorios");
  return {};
}
