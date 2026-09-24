"use server";

import { assertBudgetUnitAccess, getTenantContextForModuleOperation, isSystemAdministrator, type ModuleOperation } from "@/lib/platform/tenant-context";
import { createBankAccountWithOpeningBalance, createTreasuryTransfer, FinanceError, updateBankAccountDetails } from "@/lib/financeiro";
import { revalidatePath } from "next/cache";
import { z } from "zod";

type ActionResult = { error?: string };

const transferSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  value: z.number().finite().positive("Informe um valor maior que zero."),
  sourceBankAccountId: z.string().trim().min(1, "Selecione a conta de origem."),
  destinationBankAccountId: z.string().trim().min(1, "Selecione a conta de destino."),
  history: z.string().trim().max(500, "O histórico deve ter no máximo 500 caracteres.").optional(),
});

async function getTenantPrisma(operation: ModuleOperation) {
  return getTenantContextForModuleOperation("FINANCEIRO", operation);
}

async function assertAccountAccess(context: Awaited<ReturnType<typeof getTenantPrisma>>, accountId: string, nextBudgetUnitId?: string) {
  const account = await context.prisma.bankAccount.findUnique({ where: { id: accountId }, select: { budgetUnitId: true } });
  if (!account) throw new FinanceError("Conta bancária não encontrada.");
  if (!isSystemAdministrator(context.user)) {
    if (!account.budgetUnitId) throw new FinanceError("Somente o administrador pode classificar uma conta bancária sem Unidade Gestora.");
    assertBudgetUnitAccess(context.user, account.budgetUnitId);
  }
  if (nextBudgetUnitId) assertBudgetUnitAccess(context.user, nextBudgetUnitId);
}

async function getTransferAccount(context: Awaited<ReturnType<typeof getTenantPrisma>>, accountId: string) {
  const account = await context.prisma.bankAccount.findUnique({
    where: { id: accountId },
    select: { id: true, budgetUnitId: true, resourceSourceId: true },
  });
  if (!account) throw new FinanceError("Conta bancária não encontrada.");
  if (!account.budgetUnitId) throw new FinanceError("A conta bancária deve estar vinculada a uma Unidade Gestora.");
  assertBudgetUnitAccess(context.user, account.budgetUnitId);
  return account;
}

export async function createBankAccount(data: {
  bankName: string;
  agency: string;
  accountNumber: string;
  accountType: string;
  currentBalance: number;
  resourceSourceId: string;
  budgetUnitId: string;
  accountingPlanId: string;
  isActive: boolean;
}) {
  const context = await getTenantPrisma("create");
  assertBudgetUnitAccess(context.user, data.budgetUnitId);
  const account = await createBankAccountWithOpeningBalance(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, {
    ...data,
    openingBalance: data.currentBalance,
  });

  revalidatePath("/financeiro/contas-bancarias");
  return account;
}

export async function updateBankAccount(id: string, data: {
  bankName?: string;
  agency?: string;
  accountNumber?: string;
  accountType?: string;
  currentBalance?: number;
  resourceSourceId?: string;
  budgetUnitId?: string;
  accountingPlanId?: string;
  isActive?: boolean;
}) {
  const context = await getTenantPrisma("update");
  await assertAccountAccess(context, id, data.budgetUnitId);
  const account = await updateBankAccountDetails(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, id, data);

  revalidatePath("/financeiro/contas-bancarias");
  return account;
}

export async function toggleBankAccountStatus(id: string, isActive: boolean) {
  const context = await getTenantPrisma("update");
  await assertAccountAccess(context, id);
  const account = await updateBankAccountDetails(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, id, { isActive });

  revalidatePath("/financeiro/contas-bancarias");
  return account;
}

export async function createTreasuryTransferAction(data: {
  date: string;
  value: number;
  sourceBankAccountId: string;
  destinationBankAccountId: string;
  history?: string;
}): Promise<ActionResult> {
  const parsed = transferSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados da transferência inválidos." };

  const date = new Date(`${parsed.data.date}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== parsed.data.date) {
    return { error: "Informe uma data válida." };
  }

  try {
    const context = await getTenantPrisma("create");
    const [source, destination] = await Promise.all([
      getTransferAccount(context, parsed.data.sourceBankAccountId),
      getTransferAccount(context, parsed.data.destinationBankAccountId),
    ]);
    if (!source.resourceSourceId || !destination.resourceSourceId) {
      throw new FinanceError("As contas da transferência devem possuir fonte de recursos configurada.");
    }
    if (source.resourceSourceId !== destination.resourceSourceId) {
      throw new FinanceError("As contas da transferência devem possuir a mesma fonte de recursos.");
    }

    await createTreasuryTransfer(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, {
      ...parsed.data,
      date,
    });
    revalidatePath("/financeiro/contas-bancarias");
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível concluir a transferência." };
  }
}
