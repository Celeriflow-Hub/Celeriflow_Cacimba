"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { applyStockMovement, StockServiceError } from "@/lib/patrimonio/stock-service";
import { revalidatePath } from "next/cache";

async function getTenantPrisma(operation: ModuleOperation) {
  return (await getTenantContextForModuleOperation("OBRAS", operation)).prisma;
}

type ActionResult = { error?: string };

const obraTypes = ["Construção", "Reforma", "Pavimentação", "Drenagem", "Iluminação"] as const;
const obraStatuses = ["Em Planejamento", "Em Execução", "Concluída", "Paralisada"] as const;
const measurementStatuses = ["Em Análise", "Aprovada", "Rejeitada"] as const;
const serviceStatuses = ["Aberto", "Em Andamento", "Concluído", "Cancelado"] as const;
const text = z.string().trim().min(1, "Campo obrigatório.");
const positiveNumber = z.number().finite().min(0, "Informe um valor maior ou igual a zero.");
const inputDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.").transform((value) => new Date(`${value}T12:00:00.000Z`));

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "Já existe um registro com esses dados.";
  return fallback;
}

function revalidate(path: string) {
  revalidatePath(path);
  revalidatePath("/obras");
}

export async function createObra(data: { numero: string; nome: string; descricao?: string; local?: string; tipo: string; valorEstimado: number }): Promise<ActionResult> {
  const prisma = await getTenantPrisma("create");
  const parsed = z.object({ numero: text, nome: text, descricao: z.string().trim().optional(), local: z.string().trim().optional(), tipo: z.enum(obraTypes), valorEstimado: positiveNumber }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await prisma.obrasObra.create({ data: { ...parsed.data, descricao: parsed.data.descricao || null, local: parsed.data.local || null, status: "Em Planejamento" } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível cadastrar a obra.") };
  }
  revalidate("/obras/obras-projetos");
  return {};
}

export async function updateObra(id: string, data: { numero: string; nome: string; descricao?: string; local?: string; tipo: string; valorEstimado: number; status: string }): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  const parsed = z.object({ id: text, numero: text, nome: text, descricao: z.string().trim().optional(), local: z.string().trim().optional(), tipo: z.enum(obraTypes), valorEstimado: positiveNumber, status: z.enum(obraStatuses) }).safeParse({ id, ...data });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await prisma.obrasObra.update({ where: { id: parsed.data.id }, data: { numero: parsed.data.numero, nome: parsed.data.nome, descricao: parsed.data.descricao || null, local: parsed.data.local || null, tipo: parsed.data.tipo, valorEstimado: parsed.data.valorEstimado, status: parsed.data.status } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível atualizar a obra.") };
  }
  revalidate("/obras/obras-projetos");
  return {};
}

export async function inactivateObra(id: string): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  if (!text.safeParse(id).success) return { error: "Obra inválida." };
  try {
    await prisma.obrasObra.update({ where: { id }, data: { active: false } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível inativar a obra.") };
  }
  revalidate("/obras/obras-projetos");
  return {};
}

export async function createMedicao(data: { numero: number; data: string; valorMedido: number; obraId: string }): Promise<ActionResult> {
  const prisma = await getTenantPrisma("create");
  const parsed = z.object({ numero: z.number().int().positive("Informe um número de medição válido."), data: inputDate, valorMedido: positiveNumber, obraId: text }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const obra = await prisma.obrasObra.findUnique({ where: { id: parsed.data.obraId }, select: { active: true, status: true } });
  if (!obra) return { error: "Obra não encontrada." };
  if (!obra.active || obra.status === "Concluída") return { error: "A obra não aceita novas medições." };
  try {
    await prisma.obrasMedicao.create({ data: { ...parsed.data, status: "Em Análise" } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível cadastrar a medição.") };
  }
  revalidate("/obras/fiscalizacao-medicoes");
  return {};
}

export async function updateMedicao(id: string, data: { numero: number; data: string; valorMedido: number; status: string }): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  const parsed = z.object({ id: text, numero: z.number().int().positive("Informe um número de medição válido."), data: inputDate, valorMedido: positiveNumber, status: z.enum(measurementStatuses) }).safeParse({ id, ...data });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await prisma.obrasMedicao.update({ where: { id: parsed.data.id }, data: { numero: parsed.data.numero, data: parsed.data.data, valorMedido: parsed.data.valorMedido, status: parsed.data.status } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível atualizar a medição.") };
  }
  revalidate("/obras/fiscalizacao-medicoes");
  return {};
}

export async function inactivateMedicao(id: string): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  if (!text.safeParse(id).success) return { error: "Medição inválida." };
  try {
    await prisma.obrasMedicao.update({ where: { id }, data: { active: false } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível inativar a medição.") };
  }
  revalidate("/obras/fiscalizacao-medicoes");
  return {};
}

export async function createServico(data: { protocolo: string; tipo: string; descricao: string; local: string }): Promise<ActionResult> {
  const prisma = await getTenantPrisma("create");
  const parsed = z.object({ protocolo: text, tipo: text, descricao: text, local: text }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await prisma.obrasServico.create({ data: { ...parsed.data, status: "Aberto" } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível cadastrar o serviço.") };
  }
  revalidate("/obras/servicos-urbanos");
  return {};
}

export async function updateServico(id: string, data: { protocolo: string; tipo: string; descricao: string; local: string; status: string }): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  const parsed = z.object({ id: text, protocolo: text, tipo: text, descricao: text, local: text, status: z.enum(serviceStatuses) }).safeParse({ id, ...data });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await prisma.obrasServico.update({ where: { id: parsed.data.id }, data: { protocolo: parsed.data.protocolo, tipo: parsed.data.tipo, descricao: parsed.data.descricao, local: parsed.data.local, status: parsed.data.status } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível atualizar o serviço.") };
  }
  revalidate("/obras/servicos-urbanos");
  return {};
}

export async function inactivateServico(id: string): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  if (!text.safeParse(id).success) return { error: "Serviço inválido." };
  try {
    await prisma.obrasServico.update({ where: { id }, data: { active: false } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível inativar o serviço.") };
  }
  revalidate("/obras/servicos-urbanos");
  return {};
}

// --- Integrações com Patrimônio, Compras, RH, GED e Financeiro ---
export async function configureServicoIntegration(data: {
  serviceId: string;
  departmentId?: string;
  targetAssetId?: string;
  budgetAppropriationId?: string;
  commitmentId?: string;
  scheduledFor?: string;
  estimatedCost?: number;
}): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  const parsed = z.object({
    serviceId: text,
    departmentId: z.string().trim().optional(),
    targetAssetId: z.string().trim().optional(),
    budgetAppropriationId: z.string().trim().optional(),
    commitmentId: z.string().trim().optional(),
    scheduledFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.").optional(),
    estimatedCost: positiveNumber.optional(),
  }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const value = parsed.data;
  const [service, department, asset, appropriation, commitment] = await Promise.all([
    prisma.obrasServico.findUnique({ where: { id: value.serviceId }, select: { id: true } }),
    value.departmentId ? prisma.department.findUnique({ where: { id: value.departmentId }, select: { id: true } }) : null,
    value.targetAssetId ? prisma.asset.findUnique({ where: { id: value.targetAssetId }, select: { id: true, status: true } }) : null,
    value.budgetAppropriationId ? prisma.budgetAppropriation.findUnique({ where: { id: value.budgetAppropriationId }, select: { id: true } }) : null,
    value.commitmentId ? prisma.commitment.findUnique({ where: { id: value.commitmentId }, select: { id: true, appropriationId: true, status: true } }) : null,
  ]);
  if (!service) return { error: "Ordem de serviço não encontrada." };
  if (value.departmentId && !department) return { error: "Departamento não encontrado." };
  if (value.targetAssetId && (!asset || asset.status === "Baixado" || asset.status === "Inativo")) return { error: "Bem patrimonial não disponível." };
  if (value.budgetAppropriationId && !appropriation) return { error: "Dotação orçamentária não encontrada." };
  if (value.commitmentId && (!commitment || commitment.status === "Anulado")) return { error: "Empenho não disponível." };
  if (commitment && value.budgetAppropriationId && commitment.appropriationId !== value.budgetAppropriationId) {
    return { error: "O empenho informado não pertence à dotação selecionada." };
  }

  try {
    await prisma.obrasServico.update({
      where: { id: value.serviceId },
      data: {
        departmentId: value.departmentId || null,
        targetAssetId: value.targetAssetId || null,
        budgetAppropriationId: value.budgetAppropriationId || commitment?.appropriationId || null,
        commitmentId: value.commitmentId || null,
        scheduledFor: value.scheduledFor ? new Date(`${value.scheduledFor}T12:00:00.000Z`) : null,
        estimatedCost: value.estimatedCost ?? null,
      },
    });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível configurar as integrações da ordem.") };
  }
  revalidate("/obras/ordens-servico");
  revalidate("/obras/iluminacao-energia");
  return {};
}

export async function assignEmployeeToServico(serviceId: string, employeeId: string, role = "Executor"): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  if (!text.safeParse(serviceId).success || !text.safeParse(employeeId).success || !text.safeParse(role).success) return { error: "Dados de atribuição inválidos." };
  const [service, employee] = await Promise.all([
    prisma.obrasServico.findFirst({ where: { id: serviceId, active: true }, select: { id: true } }),
    prisma.employee.findFirst({ where: { id: employeeId, isActive: true }, select: { id: true } }),
  ]);
  if (!service || !employee) return { error: "Ordem de serviço ou servidor não disponível." };
  try {
    await prisma.obrasServicoEmployee.upsert({ where: { obrasServicoId_employeeId: { obrasServicoId: serviceId, employeeId } }, create: { obrasServicoId: serviceId, employeeId, role }, update: { role, releasedAt: null } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível atribuir o servidor.") };
  }
  revalidate("/obras/ordens-servico");
  return {};
}

export async function assignTeamToServico(serviceId: string, teamId: string): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  if (!text.safeParse(serviceId).success || !text.safeParse(teamId).success) return { error: "Dados de equipe inválidos." };
  const [service, team] = await Promise.all([
    prisma.obrasServico.findFirst({ where: { id: serviceId, active: true }, select: { id: true } }),
    prisma.obrasEquipe.findFirst({ where: { id: teamId, isActive: true }, select: { id: true } }),
  ]);
  if (!service || !team) return { error: "Ordem de serviço ou equipe não disponível." };
  try {
    await prisma.obrasServicoEquipe.upsert({ where: { obrasServicoId_equipeId: { obrasServicoId: serviceId, equipeId: teamId } }, create: { obrasServicoId: serviceId, equipeId: teamId }, update: { releasedAt: null } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível atribuir a equipe.") };
  }
  revalidate("/obras/ordens-servico");
  return {};
}

export async function assignEquipmentToServico(serviceId: string, assetId: string): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  if (!text.safeParse(serviceId).success || !text.safeParse(assetId).success) return { error: "Dados de equipamento inválidos." };
  const [service, asset] = await Promise.all([
    prisma.obrasServico.findFirst({ where: { id: serviceId, active: true }, select: { id: true } }),
    prisma.asset.findFirst({ where: { id: assetId, status: { notIn: ["Baixado", "Inativo"] } }, select: { id: true } }),
  ]);
  if (!service || !asset) return { error: "Ordem de serviço ou equipamento não disponível." };
  try {
    await prisma.obrasServicoEquipamento.upsert({ where: { obrasServicoId_assetId: { obrasServicoId: serviceId, assetId } }, create: { obrasServicoId: serviceId, assetId }, update: { releasedAt: null } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível atribuir o equipamento.") };
  }
  revalidate("/obras/maquinas-equipes");
  revalidate("/obras/ordens-servico");
  return {};
}

export async function issueMaterialToServico(data: { serviceId: string; stockId: string; quantity: number }): Promise<ActionResult> {
  const parsed = z.object({ serviceId: text, stockId: text, quantity: z.number().finite().positive("Informe uma quantidade maior que zero.") }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const context = await getTenantContextForModuleOperation("OBRAS", "create");
    const prisma = context.prisma;
    await prisma.$transaction(async (tx) => {
      const [service, stock] = await Promise.all([
        tx.obrasServico.findFirst({ where: { id: parsed.data.serviceId, active: true }, select: { id: true, departmentId: true } }),
        tx.materialStock.findUnique({ where: { id: parsed.data.stockId }, select: { id: true, materialId: true, warehouseId: true, batchNumber: true, unitCost: true } }),
      ]);
      if (!service) throw new Error("ORDER_NOT_FOUND");
      if (!stock) throw new Error("INSUFFICIENT_STOCK");

      await applyStockMovement(tx, {
        kind: "EXIT",
        quantity: parsed.data.quantity,
        warehouseId: stock.warehouseId,
        materialId: stock.materialId,
        batchNumber: stock.batchNumber,
        unitCost: stock.unitCost,
        reason: "Execução de ordem de serviço",
        departmentId: service.departmentId,
        obrasServicoId: service.id,
        actor: { usuarioId: context.user.id, employeeId: context.user.employeeId },
      });

      await tx.obrasServicoMaterial.upsert({
        where: { obrasServicoId_materialId: { obrasServicoId: service.id, materialId: stock.materialId } },
        create: { obrasServicoId: service.id, materialId: stock.materialId, stockId: stock.id, quantityPlanned: parsed.data.quantity, quantityIssued: parsed.data.quantity, unitCost: stock.unitCost },
        update: { stockId: stock.id, quantityIssued: { increment: parsed.data.quantity }, unitCost: stock.unitCost },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") return { error: "Ordem de serviço não disponível." };
    if (error instanceof StockServiceError && error.message === "Estoque insuficiente para atender a solicitação.") return { error: error.message };
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") return { error: "Estoque insuficiente para atender a solicitação." };
    return { error: errorMessage(error, "Não foi possível baixar o material do estoque.") };
  }
  revalidate("/obras/ordens-servico");
  revalidate("/obras/iluminacao-energia");
  return {};
}

export async function linkPurchaseToServico(data: { serviceId: string; purchaseRequestId?: string; purchaseProcessId?: string; purpose?: string }): Promise<ActionResult> {
  const prisma = await getTenantPrisma("create");
  const parsed = z.object({ serviceId: text, purchaseRequestId: z.string().trim().optional(), purchaseProcessId: z.string().trim().optional(), purpose: z.string().trim().optional() }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!parsed.data.purchaseRequestId && !parsed.data.purchaseProcessId) return { error: "Informe uma solicitação ou processo de compra." };
  const [service, request, process] = await Promise.all([
    prisma.obrasServico.findUnique({ where: { id: parsed.data.serviceId }, select: { id: true } }),
    parsed.data.purchaseRequestId ? prisma.purchaseRequest.findUnique({ where: { id: parsed.data.purchaseRequestId }, select: { id: true } }) : null,
    parsed.data.purchaseProcessId ? prisma.purchaseProcess.findUnique({ where: { id: parsed.data.purchaseProcessId }, select: { id: true } }) : null,
  ]);
  if (!service || (parsed.data.purchaseRequestId && !request) || (parsed.data.purchaseProcessId && !process)) return { error: "Referência de compra não encontrada." };
  try {
    await prisma.obrasServicoCompra.create({ data: { obrasServicoId: service.id, purchaseRequestId: request?.id, purchaseProcessId: process?.id, purpose: parsed.data.purpose || "Material" } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível vincular a compra à ordem.") };
  }
  revalidate("/obras/ordens-servico");
  return {};
}

export async function attachDocumentToServico(data: { serviceId: string; documentId: string; purpose?: string }): Promise<ActionResult> {
  const prisma = await getTenantPrisma("update");
  const parsed = z.object({ serviceId: text, documentId: text, purpose: z.string().trim().optional() }).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const [service, document] = await Promise.all([
    prisma.obrasServico.findUnique({ where: { id: parsed.data.serviceId }, select: { id: true } }),
    prisma.document.findUnique({ where: { id: parsed.data.documentId }, select: { id: true } }),
  ]);
  if (!service || !document) return { error: "Ordem de serviço ou documento GED não encontrado." };
  try {
    await prisma.obrasServicoDocumento.upsert({ where: { obrasServicoId_documentId: { obrasServicoId: service.id, documentId: document.id } }, create: { obrasServicoId: service.id, documentId: document.id, purpose: parsed.data.purpose || "Comprovante" }, update: { purpose: parsed.data.purpose || "Comprovante" } });
  } catch (error) {
    return { error: errorMessage(error, "Não foi possível vincular o documento GED.") };
  }
  revalidate("/obras/documentos");
  revalidate("/obras/ordens-servico");
  return {};
}
