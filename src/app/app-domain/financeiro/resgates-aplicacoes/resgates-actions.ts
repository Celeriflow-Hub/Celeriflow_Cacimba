"use server";

import { getTenantContextForModule, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { classifyBankMovement, sendMovementToMunicipalSystem, type ClassificationResult, type MunicipalIntegrationReceipt } from "@/lib/financeiro/classification-engine";
import { revalidatePath } from "next/cache";

type ActionResult<T = unknown> = { error?: string; data?: T };

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" && error.message) {
    return error.message;
  }
  return fallback;
}

export async function getBankStatementItemsAction(): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModule("FINANCEIRO");
    const items = await context.prisma.bankStatementItem.findMany({
      where: { banco: "001 - Banco Virtual Robonuvem" },
      orderBy: { date: "desc" },
      take: 20,
    });
    return { data: items };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Erro ao carregar lançamentos bancários.") };
  }
}

export async function classifyItemAction(input: {
  descricao: string;
  codigoTransacao?: string;
  sinal: "CREDITO" | "DEBITO";
  valor: number;
  banco?: string;
  contaNumero?: string;
}): Promise<ActionResult<ClassificationResult>> {
  try {
    const context = await getTenantContextForModule("FINANCEIRO");
    const result = await classifyBankMovement(context.prisma, input);
    return { data: result };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Erro ao classificar lançamento.") };
  }
}

export async function transmitItemAction(input: { statementItemId: string }): Promise<ActionResult<MunicipalIntegrationReceipt>> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const item = await context.prisma.bankStatementItem.findFirst({ where: { id: input.statementItemId, banco: "001 - Banco Virtual Robonuvem" }, select: { id: true } });
    if (!item) return { error: "O lançamento informado não pertence ao Banco Virtual Robonuvem." };
    const receipt = await sendMovementToMunicipalSystem(context.prisma, {
      statementItemId: item.id,
      usuarioId: context.user.id,
      employeeId: context.user.employeeId,
    });

    revalidatePath("/financeiro/resgates-aplicacoes");
    return { data: receipt };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Erro ao registrar lançamento no CeleriFlow.") };
  }
}
