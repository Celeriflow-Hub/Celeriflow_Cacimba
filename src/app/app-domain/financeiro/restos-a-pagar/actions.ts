"use server";

import { cancelPayableCarryForward, FinanceError, reregisterPayableCarryForward, trackPayableCarryForwardPayment } from "@/lib/financeiro";
import { assertBudgetUnitAccess, getTenantContextForModuleOperation, type ModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

type ActionResult = { error?: string };
const message = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir o acompanhamento do resto a pagar.";

async function assertPayableCarryForwardAccess(payableCarryForwardId: string, operation: ModuleOperation) {
  const context = await getTenantContextForModuleOperation("FINANCEIRO", operation);
  const payable = await context.prisma.payableCarryForward.findUnique({
    where: { id: payableCarryForwardId },
    select: { commitment: { select: { appropriation: { select: { budgetUnitId: true } } } } },
  });
  if (!payable) throw new FinanceError("Resto a pagar não encontrado.");
  assertBudgetUnitAccess(context.user, payable.commitment.appropriation.budgetUnitId);
  return context;
}

function revalidateRap() {
  revalidatePath("/financeiro/restos-a-pagar");
  revalidatePath("/financeiro/contabilidade");
}

export async function trackRapPayment(data: { payableCarryForwardId: string; paymentId: string; value: number }): Promise<ActionResult> {
  try {
    const context = await assertPayableCarryForwardAccess(data.payableCarryForwardId, "update");
    await trackPayableCarryForwardPayment(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data);
    revalidateRap();
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function cancelRap(data: { payableCarryForwardId: string; justification: string }): Promise<ActionResult> {
  try {
    const context = await assertPayableCarryForwardAccess(data.payableCarryForwardId, "delete");
    await cancelPayableCarryForward(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data);
    revalidateRap();
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function reregisterRap(data: { payableCarryForwardId: string; targetFinancialYearId: string; justification: string }): Promise<ActionResult> {
  try {
    const context = await assertPayableCarryForwardAccess(data.payableCarryForwardId, "create");
    await reregisterPayableCarryForward(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data);
    revalidateRap();
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}
