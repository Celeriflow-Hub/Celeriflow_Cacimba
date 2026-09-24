"use server";

import { FinanceError, createPayment as createOfficialPayment, updatePaymentStatus as updateOfficialPaymentStatus } from "@/lib/financeiro";
import { assertBudgetUnitAccess, getTenantContextForModuleOperation, type AppContext, type ModuleOperation } from "@/lib/platform/tenant-context";
import { revalidatePath } from "next/cache";

type ActionResult = { error?: string };
const message = (error: unknown) => error instanceof Error ? error.message : "Não foi possível concluir o pagamento.";

async function assertCommitmentAccess(context: AppContext, commitmentId: string) {
  const commitment = await context.prisma.commitment.findUnique({
    where: { id: commitmentId },
    select: { contractId: true, appropriation: { select: { budgetUnitId: true } } },
  });
  if (!commitment) throw new FinanceError("Empenho não encontrado.");
  assertBudgetUnitAccess(context.user, commitment.appropriation.budgetUnitId);
  return commitment;
}

function revalidateContractExecution(contractId?: string | null) {
  if (!contractId) return;
  revalidatePath("/compras/contratos");
  revalidatePath(`/compras/contratos/${contractId}`);
}

async function assertBankAccountAccess(context: AppContext, bankAccountId: string) {
  const account = await context.prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
    select: { budgetUnitId: true },
  });
  if (!account?.budgetUnitId) throw new FinanceError("A conta bancária deve estar vinculada a uma Unidade Gestora.");
  assertBudgetUnitAccess(context.user, account.budgetUnitId);
}

export async function createPayment(data: {
  orderNumber: string;
  date: Date;
  value: number;
  commitmentId: string;
  settlementId: string;
  bankAccountId: string;
  supplierId: string;
  paymentMethod: string;
  // Kept for direct callers; the domain validates it against the settlement calculation.
  serviceCode?: string;
  retentionRuleIds?: string[];
}): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const commitment = await assertCommitmentAccess(context, data.commitmentId);
    await assertBankAccountAccess(context, data.bankAccountId);
    const payment = await createOfficialPayment(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, data);
    const bankOrder = await context.prisma.payment.findUnique({
      where: { id: payment.id },
      select: {
        paymentOrderExternalId: true,
        integrationEventId: true,
        bankAccountExternalId: true,
        netValueDecimal: true,
        date: true,
        paymentMethod: true,
        orderNumber: true,
        supplier: { include: { company: true, person: true } },
      },
    });
    if (bankOrder?.paymentOrderExternalId && bankOrder.integrationEventId && bankOrder.bankAccountExternalId && bankOrder.netValueDecimal) {
      try {
        const { bankIntegrationClient } = await import("@/lib/financeiro/bank-integration-client");
        const beneficiaryName = bankOrder.supplier.company?.corporateName ?? bankOrder.supplier.person?.fullName ?? "FAVORECIDO DEMO";
        const beneficiaryDocument = bankOrder.supplier.company?.cnpj ?? bankOrder.supplier.person?.cpf ?? undefined;
        await bankIntegrationClient.submitPaymentOrder({
          paymentOrderExternalId: bankOrder.paymentOrderExternalId,
          integrationEventId: bankOrder.integrationEventId,
          bankAccountExternalId: bankOrder.bankAccountExternalId,
          clientReference: bankOrder.orderNumber,
          beneficiary: { name: beneficiaryName, document: beneficiaryDocument ?? undefined },
          amount: Number(bankOrder.netValueDecimal),
          scheduledDate: bankOrder.date,
          paymentMethod: bankOrder.paymentMethod,
          purposeText: `Pagamento líquido da ${bankOrder.paymentOrderExternalId}`,
          idempotencyKey: `celeriflow:payment:${bankOrder.paymentOrderExternalId}:v1`,
        });
        await context.prisma.payment.update({ where: { id: payment.id }, data: { bankStatus: "RECEIVED", bankSubmittedAt: new Date() } });
      } catch (bankError) {
        console.error("Ordem criada, mas não foi possível enviá-la ao Banco Virtual:", bankError);
      }
    }
    revalidatePath("/financeiro/pagamentos");
    revalidatePath("/financeiro/liquidacoes");
    revalidatePath("/financeiro/empenhos");
    revalidateContractExecution(commitment.contractId);
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function cancelPayment(id: string): Promise<ActionResult> {
  return updatePaymentStatus(id, "Cancelada");
}

export async function updatePaymentStatus(id: string, status: string): Promise<ActionResult> {
  try {
    if (status === "Paga") throw new FinanceError("A baixa do pagamento ocorre exclusivamente após a confirmação do Banco Virtual.");
    const operation: ModuleOperation = status === "Cancelada" ? "delete" : "update";
    const context = await getTenantContextForModuleOperation("FINANCEIRO", operation);
    const payment = await context.prisma.payment.findUnique({ where: { id }, select: { commitmentId: true } });
    if (!payment) throw new FinanceError("Pagamento não encontrado.");
    const commitment = await assertCommitmentAccess(context, payment.commitmentId);
    await updateOfficialPaymentStatus(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, id, status);
    revalidatePath("/financeiro/pagamentos");
    revalidatePath("/financeiro/liquidacoes");
    revalidatePath("/financeiro/empenhos");
    revalidateContractExecution(commitment.contractId);
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function reversePaymentAction(paymentId: string, justification: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "delete");
    const payment = await context.prisma.payment.findUnique({ where: { id: paymentId }, select: { commitmentId: true } });
    if (!payment) throw new FinanceError("Pagamento não encontrado.");
    const commitment = await assertCommitmentAccess(context, payment.commitmentId);
    const { reversePayment: reverseOfficialPayment } = await import("@/lib/financeiro");
    await reverseOfficialPayment(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, paymentId, justification);
    revalidatePath("/financeiro/pagamentos");
    revalidatePath("/financeiro/liquidacoes");
    revalidatePath("/financeiro/empenhos");
    revalidateContractExecution(commitment.contractId);
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}

export async function settleWithholdingPayableAction(withholdingPayableId: string, bankAccountId: string, receiptDocumentId: string): Promise<ActionResult> {
  try {
    const context = await getTenantContextForModuleOperation("FINANCEIRO", "create");
    const payable = await context.prisma.withholdingPayable.findUnique({
      where: { id: withholdingPayableId },
      select: { retention: { select: { payment: { select: { commitmentId: true } } } } },
    });
    if (!payable?.retention?.payment?.commitmentId) throw new FinanceError("Consignação/retenção não encontrada.");
    const commitment = await assertCommitmentAccess(context, payable.retention.payment.commitmentId);

    await assertBankAccountAccess(context, bankAccountId);

    const { settleWithholdingPayable: settleOfficialWithholding } = await import("@/lib/financeiro");
    await settleOfficialWithholding(context.prisma, { usuarioId: context.user.id, employeeId: context.user.employeeId }, { withholdingPayableId, bankAccountId, receiptDocumentId, paymentDate: new Date() });
    revalidatePath("/financeiro/pagamentos");
    revalidateContractExecution(commitment.contractId);
    return {};
  } catch (error) {
    return { error: message(error) };
  }
}
