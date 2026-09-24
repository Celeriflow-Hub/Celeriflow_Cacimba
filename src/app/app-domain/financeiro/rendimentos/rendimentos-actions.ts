"use server";

import { getTenantContextForModule, getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { calculateInvestmentYield, transmitYieldToMunicipalSystem, type YieldCalculationResult, type YieldTransmissionResult, YieldType } from "@/lib/financeiro/yield-engine";
import { bankIntegrationClient, type InvestmentYieldDTO } from "@/lib/financeiro/bank-integration-client";
import { revalidatePath } from "next/cache";
import { isPocVirtualBank, isPocVirtualBankAccount, pocVirtualBank } from "@/lib/poc/poc-config";

type ActionResult<T = unknown> = { error?: string; data?: T };
type ExternalYieldForClient = Omit<InvestmentYieldDTO, "data"> & { data: string; statementItemId?: string; alreadyProcessed: boolean };

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string" && error.message) {
    return error.message;
  }
  return fallback;
}

export async function calculateYieldAction(input: {
  valorBruto: number;
  irrf?: number;
  iof?: number;
  correcaoMonetaria?: number;
  saldoAnteriorAcumulado?: number;
  isEstorno?: boolean;
}): Promise<ActionResult<YieldCalculationResult>> {
  try {
    const result = calculateInvestmentYield(input);
    return { data: result };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Erro no cálculo de rendimentos.") };
  }
}

export async function transmitYieldAction(input: {
  statementItemId?: string;
  contaNumero: string;
  data: string;
  valorBruto: number;
  irrf: number;
  iof: number;
  correcaoMonetaria: number;
  valorLiquido: number;
  saldoAcumulado: number;
  tipo: YieldType;
}): Promise<ActionResult<YieldTransmissionResult>> {
  try {
    if (!isPocVirtualBankAccount(input.contaNumero)) return { error: "A conta informada não pertence ao Banco Virtual Robonuvem." };
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const result = await transmitYieldToMunicipalSystem(context.prisma, {
      ...input,
      data: new Date(input.data),
      usuarioId: context.user.id,
      employeeId: context.user.employeeId,
    });

    revalidatePath("/financeiro/rendimentos");
    return { data: result };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Erro na transmissão do rendimento.") };
  }
}

export async function getYieldHistoryAction(): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModule("FINANCEIRO");
    const history = await context.prisma.yieldTransaction.findMany({
      where: { contaNumero: { in: [...pocVirtualBank.accountNumbers] } },
      orderBy: { createdAt: "desc" },
      take: 15,
    });
    return { data: history };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Erro ao buscar histórico de rendimentos.") };
  }
}

export async function fetchExternalYieldsAction(input: {
  banco: string;
  agencia: string;
  contaNumero: string;
  periodoInicio: string;
  periodoFim: string;
}): Promise<ActionResult<ExternalYieldForClient[]>> {
  try {
    if (!isPocVirtualBank(input.banco) || !isPocVirtualBankAccount(input.contaNumero)) {
      return { error: "A POC aceita somente contas do Banco Virtual Robonuvem." };
    }
    const context = await getTenantContextForModule("FINANCEIRO");
    const yields = await bankIntegrationClient.fetchYieldReport(
      {
        banco: input.banco,
        agencia: input.agencia,
        contaNumero: input.contaNumero,
      },
      {
        periodoInicio: input.periodoInicio,
        periodoFim: input.periodoFim,
      }
    );
    const references = yields.map((item) => item.documentoRef).filter((reference): reference is string => Boolean(reference));
    const statementItems = await context.prisma.bankStatementItem.findMany({
      where: { banco: input.banco, agencia: input.agencia, contaNumero: input.contaNumero, codigoTransacao: { in: references } },
      select: { id: true, codigoTransacao: true, treasuryMovementId: true },
    });
    const itemsByReference = new Map(statementItems.map((item) => [item.codigoTransacao, item]));
    return {
      data: yields.map((item) => ({
        ...item,
        data: item.data.toISOString(),
        statementItemId: item.documentoRef ? itemsByReference.get(item.documentoRef)?.id : undefined,
        alreadyProcessed: Boolean(item.documentoRef && itemsByReference.get(item.documentoRef)?.treasuryMovementId),
      })),
    };
  } catch (err: unknown) {
    return { error: errorMessage(err, "Erro ao consultar rendimentos no Banco Virtual Robonuvem.") };
  }
}
