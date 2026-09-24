"use server";

import { acquireAssetFromPurchaseReceipt, AssetAcquisitionError, type AssetAcquisitionInput } from "@/lib/patrimonio/asset-acquisition-service";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { assetOperationWhere, AssetOperationError } from "@/lib/patrimonio/asset-operations";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResult = { error?: string; assetId?: string };

const assetEditInput = z.object({
  name: z.string().trim().min(1, "Informe o nome do bem.").max(240),
  description: z.string().trim().max(4000).optional(),
  brand: z.string().trim().max(160).optional(),
  model: z.string().trim().max(160).optional(),
  serialNumber: z.string().trim().max(160).optional(),
  categoryId: z.string().trim().min(1, "Selecione a categoria patrimonial."),
});

type AssetEditInput = z.input<typeof assetEditInput>;

function revalidateAssetPages() {
  revalidatePath("/patrimonio/bens");
  revalidatePath("/patrimonio/ciclo-vida");
  revalidatePath("/patrimonio");
  revalidatePath("/patrimonio", "layout");
}

export async function acquireAssetFromReceiptAction(input: AssetAcquisitionInput): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "create");
    const asset = await acquireAssetFromPurchaseReceipt(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, input);
    revalidatePath("/patrimonio/bens");
    revalidatePath("/patrimonio");
    return { assetId: asset.id };
  } catch (error) {
    return { error: error instanceof AssetAcquisitionError ? error.message : "Não foi possível tombar o bem." };
  }
}

export async function updateAssetAction(assetId: string, input: AssetEditInput): Promise<ActionResult> {
  try {
    const parsed = assetEditInput.parse(input);
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "update");
    const scope = assetOperationWhere(context);
    const [asset, category] = await Promise.all([
      context.prisma.asset.findFirst({ where: { id: assetId, ...scope }, select: { id: true, status: true } }),
      context.prisma.assetCategory.findFirst({ where: { id: parsed.categoryId, isActive: true }, select: { id: true } }),
    ]);
    if (!asset || asset.status === "Baixado") throw new AssetOperationError("Bem não encontrado, baixado ou fora do seu setor.");
    if (!category) throw new AssetOperationError("Categoria patrimonial não encontrada ou inativa.");

    await context.prisma.asset.update({
      where: { id: asset.id },
      data: {
        name: parsed.name,
        description: parsed.description || null,
        brand: parsed.brand || null,
        model: parsed.model || null,
        serialNumber: parsed.serialNumber || null,
        categoryId: category.id,
      },
    });
    revalidateAssetPages();
    return { assetId: asset.id };
  } catch (error) {
    return { error: error instanceof AssetOperationError ? error.message : error instanceof z.ZodError ? error.issues[0]?.message || "Revise os dados do bem." : "Não foi possível atualizar o bem patrimonial." };
  }
}

export async function setAssetActiveAction(assetId: string, active: boolean): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "update");
    const expectedStatuses = active ? ["Inativo"] : ["Ativo", "Em uso", "Ocioso"];
    const updated = await context.prisma.asset.updateMany({
      where: {
        id: assetId,
        ...assetOperationWhere(context),
        status: { in: expectedStatuses },
        ...(!active ? { fleetUnit: { is: { orders: { none: { status: "EMITIDA" } } } } } : {}),
      },
      data: { status: active ? "Ativo" : "Inativo" },
    });
    if (updated.count !== 1) {
      throw new AssetOperationError(active ? "O bem não está inativo, foi alterado por outra operação ou está fora do seu setor." : "O bem não pode ser inativado porque foi alterado, possui operação pendente de Frota ou não está em situação elegível.");
    }
    revalidateAssetPages();
    return { assetId };
  } catch (error) {
    return { error: error instanceof AssetOperationError ? error.message : "Não foi possível alterar a situação do bem." };
  }
}
