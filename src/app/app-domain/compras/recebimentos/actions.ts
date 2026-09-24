"use server";

import { approvePurchaseReceipt, ProcurementLifecycleError, type ApprovePurchaseReceiptInput } from "@/lib/compras/procurement-lifecycle";
import { ProcurementFinanceBridgeError, recordPurchaseReceiptLiquidationAuthorization } from "@/lib/compras/procurement-finance-bridge";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

type ActionResult = { error?: string; receiptId?: string };

export async function approvePurchaseReceiptAction(input: ApprovePurchaseReceiptInput): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("COMPRAS", "create");
    const receipt = await approvePurchaseReceipt(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, input);
    await recordPurchaseReceiptLiquidationAuthorization(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, receipt.id);
    revalidatePath("/patrimonio/materiais");
    revalidatePath("/patrimonio/bens");
    revalidatePath("/compras/contratos");
    revalidatePath("/compras/recebimentos");
    revalidatePath("/financeiro/orcamento");
    return { receiptId: receipt.id };
  } catch (error) {
    return { error: error instanceof ProcurementLifecycleError || error instanceof ProcurementFinanceBridgeError ? error.message : "Não foi possível aprovar o recebimento." };
  }
}
