"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";

const text = (maximum: number) => z.string().trim().max(maximum).optional();
const warehouseInput = z.object({
  name: z.string().trim().min(1, "Informe o nome do almoxarifado.").max(160),
  type: z.enum(["Central", "Setorial"]),
  zipCode: text(16),
  streetName: text(180),
  number: text(30),
  neighborhood: text(120),
  city: text(120),
  state: text(2),
  managerId: text(100),
  costCenterId: text(100),
});

type WarehouseActionResult = { error?: string };

function formInput(formData: FormData) {
  return warehouseInput.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    zipCode: formData.get("zipCode"),
    streetName: formData.get("streetName"),
    number: formData.get("number"),
    neighborhood: formData.get("neighborhood"),
    city: formData.get("city"),
    state: String(formData.get("state") || "").toUpperCase(),
    managerId: formData.get("managerId"),
    costCenterId: formData.get("costCenterId"),
  });
}

function normalizedAddress(input: z.output<typeof warehouseInput>) {
  const parts = [
    input.streetName && input.number ? `${input.streetName}, ${input.number}` : input.streetName,
    input.neighborhood,
    input.city && input.state ? `${input.city}/${input.state}` : input.city || input.state,
    input.zipCode ? `CEP ${input.zipCode}` : undefined,
  ].filter(Boolean);
  return parts.join(" - ") || null;
}

async function validateReferences(
  prisma: Awaited<ReturnType<typeof getTenantContextForModuleOperation>>["prisma"],
  input: z.output<typeof warehouseInput>,
  currentCostCenterId?: string | null,
) {
  const managerId = input.managerId || undefined;
  const costCenterId = input.costCenterId || undefined;
  const [manager, costCenter] = await Promise.all([
    managerId ? prisma.employee.findFirst({ where: { id: managerId, isActive: true }, select: { id: true } }) : null,
    costCenterId ? prisma.costCenter.findUnique({ where: { id: costCenterId }, select: { id: true, isActive: true } }) : null,
  ]);
  if (managerId && !manager) throw new Error("Selecione um responsável ativo.");
  if (costCenterId && (!costCenter || (!costCenter.isActive && costCenter.id !== currentCostCenterId))) throw new Error("Selecione um centro de custo ativo.");
  return { managerId: manager?.id || null, costCenterId: costCenter?.id || null };
}

function revalidateWarehouses() {
  revalidatePath("/patrimonio/almoxarifados");
  revalidatePath("/patrimonio/materiais");
  revalidatePath("/patrimonio");
  revalidatePath("/patrimonio", "layout");
}

export async function createWarehouseAction(formData: FormData): Promise<void> {
  const parsed = formInput(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Dados do almoxarifado inválidos.");
  const context = await getTenantContextForModuleOperation("PATRIMONIO", "create");
  const references = await validateReferences(context.prisma, parsed.data);
  await context.prisma.warehouse.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      zipCode: parsed.data.zipCode || null,
      streetName: parsed.data.streetName || null,
      number: parsed.data.number || null,
      neighborhood: parsed.data.neighborhood || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      address: normalizedAddress(parsed.data),
      ...references,
    },
  });
  revalidateWarehouses();
  redirect("/patrimonio/almoxarifados");
}

export async function updateWarehouseAction(id: string, formData: FormData): Promise<void> {
  const parsed = formInput(formData);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Dados do almoxarifado inválidos.");
  const context = await getTenantContextForModuleOperation("PATRIMONIO", "update");
  const existing = await context.prisma.warehouse.findUnique({ where: { id }, select: { id: true, address: true, costCenterId: true } });
  if (!existing) throw new Error("Almoxarifado não encontrado.");
  const references = await validateReferences(context.prisma, parsed.data, existing.costCenterId);
  const address = normalizedAddress(parsed.data);
  await context.prisma.warehouse.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      zipCode: parsed.data.zipCode || null,
      streetName: parsed.data.streetName || null,
      number: parsed.data.number || null,
      neighborhood: parsed.data.neighborhood || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      address: address ?? existing.address,
      ...references,
    },
  });
  revalidateWarehouses();
  redirect("/patrimonio/almoxarifados");
}

export async function setWarehouseActiveAction(id: string, active: boolean): Promise<WarehouseActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "update");
    const warehouse = await context.prisma.warehouse.findUnique({ where: { id }, select: { id: true } });
    if (!warehouse) throw new Error("Almoxarifado não encontrado.");
    await context.prisma.warehouse.update({ where: { id: warehouse.id }, data: { isActive: active } });
    revalidateWarehouses();
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível alterar a situação do almoxarifado." };
  }
}

export async function deleteWarehouseAction(id: string): Promise<WarehouseActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "delete");
    const warehouse = await context.prisma.warehouse.findUnique({
      where: { id },
      select: { id: true, _count: { select: { stocks: true, movements: true, receiptItems: true, inventorySessions: true, schoolMeals: true } } },
    });
    if (!warehouse) throw new Error("Almoxarifado não encontrado.");
    const linkedRecords = Object.values(warehouse._count).reduce((total, value) => total + value, 0);
    if (linkedRecords > 0) throw new Error("Este almoxarifado possui movimentações, estoque ou outros registros vinculados. Inative-o em vez de excluir.");
    await context.prisma.warehouse.delete({ where: { id: warehouse.id } });
    revalidateWarehouses();
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível excluir o almoxarifado." };
  }
}
