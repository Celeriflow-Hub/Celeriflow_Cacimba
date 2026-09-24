"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { AccessError, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { AssetOperationError, operateAsset, type AssetOperationInput } from "@/lib/patrimonio/asset-operations";

export async function operateAssetAction(input: AssetOperationInput) {
  try {
    const context = await getTenantContextForModuleOperation("PATRIMONIO", "update");
    await operateAsset(context, input);
    revalidatePath("/patrimonio", "layout"); revalidatePath("/frotas");
    return { error: undefined, message: "Operação patrimonial confirmada. A frota vinculada foi atualizada." };
  } catch (error) {
    const concurrency = error instanceof Prisma.PrismaClientKnownRequestError && ["P2025", "P2034"].includes(error.code);
    return { error: error instanceof AssetOperationError || error instanceof AccessError ? error.message : error instanceof z.ZodError ? "Revise os campos obrigatórios e as datas." : concurrency ? "O registro mudou em outra sessão. Reabra a ficha antes de confirmar." : "Não foi possível confirmar. Os dados foram preservados.", message: undefined };
  }
}
