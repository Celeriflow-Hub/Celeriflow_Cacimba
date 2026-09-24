"use server";

import { FinanceError, authorizeAccountingMonthClose, authorizeAccountingMonthReopen, configureAccountingPostingRule, finalizeAnnualAccountingClose, postAccountingTransaction, prepareAnnualAccountingClose, requestAccountingMonthClose, requestAccountingMonthReopen } from "@/lib/financeiro";
import { getTenantContextForModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

type ActionResult = { error?: string };
const message = (error: unknown) => error instanceof FinanceError ? error.message : "Nao foi possivel concluir a operacao contabil.";

export async function postManualAccountingTransaction(data: { financialYearId: string; date: string; history: string; debitAccountId: string; creditAccountId: string; value: number }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    await postAccountingTransaction(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, {
      financialYearId: data.financialYearId,
      date: new Date(data.date),
      history: data.history,
      lines: [{ accountId: data.debitAccountId, type: "Débito", value: data.value }, { accountId: data.creditAccountId, type: "Crédito", value: data.value }],
    });
    revalidatePath("/financeiro/contabilidade");
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function requestMonthClose(data: { financialYearId: string; competence: string }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    await requestAccountingMonthClose(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data.financialYearId, new Date(data.competence));
    revalidatePath("/financeiro/contabilidade");
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function authorizeMonthClose(data: { financialYearId: string; competence: string }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    await authorizeAccountingMonthClose(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data.financialYearId, new Date(data.competence));
    revalidatePath("/financeiro/contabilidade");
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function requestMonthReopen(data: { financialYearId: string; competence: string; justification: string }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    await requestAccountingMonthReopen(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data.financialYearId, new Date(data.competence), data.justification);
    revalidatePath("/financeiro/contabilidade");
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function authorizeMonthReopen(data: { financialYearId: string; competence: string }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    await authorizeAccountingMonthReopen(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data.financialYearId, new Date(data.competence));
    revalidatePath("/financeiro/contabilidade");
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function prepareAnnualClose(financialYearId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    await prepareAnnualAccountingClose(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, financialYearId);
    revalidatePath("/financeiro/contabilidade");
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function finalizeAnnualClose(financialYearId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    await finalizeAnnualAccountingClose(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, financialYearId);
    revalidatePath("/financeiro/contabilidade");
    revalidatePath("/financeiro/orcamento");
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function savePostingRule(data: { eventCode: string; eventName: string; debitAccountId: string; creditAccountId: string }): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "update");
    await configureAccountingPostingRule(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data);
    revalidatePath("/financeiro/contabilidade");
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}
