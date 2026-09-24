"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";

const costCenterInput = z.object({
  code: z.string().trim().min(1, "Informe o código do centro de custo.").max(60),
  name: z.string().trim().min(1, "Informe o nome do centro de custo.").max(180),
  description: z.string().trim().max(2000).optional(),
});

type CostCenterActionResult = { error?: string };

function parse(formData: FormData) {
  return costCenterInput.safeParse({ code: String(formData.get("code") || "").toUpperCase(), name: formData.get("name"), description: formData.get("description") });
}

function revalidateCostCenters() {
  revalidatePath("/patrimonio/centros-custo");
  revalidatePath("/patrimonio/almoxarifados");
  revalidatePath("/patrimonio", "layout");
}

export async function createCostCenterAction(formData: FormData): Promise<void> {
  const parsed = parse(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Dados do centro de custo inválidos.");
  const context = await getTenantContextForModuleOperation("PATRIMONIO", "create");
  const existing = await context.prisma.costCenter.findUnique({ where: { code: parsed.data.code }, select: { id: true } });
  if (existing) throw new Error("Já existe um centro de custo com este código.");
  await context.prisma.costCenter.create({ data: { code: parsed.data.code, name: parsed.data.name, description: parsed.data.description || null } });
  revalidateCostCenters();
  redirect("/patrimonio/centros-custo");
}

export async function updateCostCenterAction(id: string, formData: FormData): Promise<void> {
  const parsed = parse(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Dados do centro de custo inválidos.");
  const context = await getTenantContextForModuleOperation("PATRIMONIO", "update");
  const existing = await context.prisma.costCenter.findUnique({ where: { id }, select: { id: true } });
  const duplicate = await context.prisma.costCenter.findFirst({ where: { code: parsed.data.code, id: { not: id } }, select: { id: true } });
  if (!existing) throw new Error("Centro de custo não encontrado.");
  if (duplicate) throw new Error("Já existe um centro de custo com este código.");
  await context.prisma.costCenter.update({ where: { id }, data: { code: parsed.data.code, name: parsed.data.name, description: parsed.data.description || null } });
  revalidateCostCenters();
  redirect("/patrimonio/centros-custo");
}

export async function setCostCenterActiveAction(id: string, active: boolean): Promise<CostCenterActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "update");
    const costCenter = await context.prisma.costCenter.findUnique({ where: { id }, select: { id: true } });
    if (!costCenter) throw new Error("Centro de custo não encontrado.");
    await context.prisma.costCenter.update({ where: { id }, data: { isActive: active } });
    revalidateCostCenters();
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível alterar a situação do centro de custo." };
  }
}

export async function deleteCostCenterAction(id: string): Promise<CostCenterActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "delete");
    const costCenter = await context.prisma.costCenter.findUnique({ where: { id }, select: { id: true, _count: { select: { warehouses: true } } } });
    if (!costCenter) throw new Error("Centro de custo não encontrado.");
    if (costCenter._count.warehouses > 0) throw new Error("Este centro de custo está vinculado a almoxarifados. Inative-o ou remova os vínculos antes de excluir.");
    await context.prisma.costCenter.delete({ where: { id } });
    revalidateCostCenters();
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível excluir o centro de custo." };
  }
}
