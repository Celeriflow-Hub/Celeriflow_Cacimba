import { getTenantContextForModule, isSystemAdministrator } from "@/lib/platform/tenant-context";
import PagamentosClient from "./PagamentosClient"

export default async function PagamentosPage() {
  const context = await getTenantContextForModule("FINANCEIRO");
  const { prisma } = context;
  const appropriationFilter = isSystemAdministrator(context.user)
    ? {}
    : { budgetUnitId: { in: context.user.allowedBudgetUnitIds } };
  const payments = await prisma.payment.findMany({
    where: { commitment: { appropriation: appropriationFilter } },
    include: {
      commitment: { include: { purchaseReceipt: { select: { number: true } } } },
      settlement: { select: { id: true, documentRef: true, valueDecimal: true, value: true } },
      financialDocument: { select: { id: true, number: true, title: true } },
      bankAccount: true,
      retentions: { select: { valueDecimal: true } },
      supplier: {
        include: {
          person: true,
          company: true
        }
      }
    },
    orderBy: {
      date: 'desc'
    },
    take: 50
  })

  const commitments = await prisma.commitment.findMany({
    where: {
      status: { in: ["Emitido", "Liquidado", "Pago"] }
      , appropriation: appropriationFilter
    },
    include: { movements: { select: { type: true, valueDecimal: true } }, purchaseReceipt: { select: { number: true } } },
  })

  const settlements = await prisma.settlement.findMany({
    where: { status: "Liquidado", commitment: { appropriation: appropriationFilter } },
    select: {
      id: true,
      commitmentId: true,
      documentRef: true,
      value: true,
      valueDecimal: true,
      payments: { where: { status: { in: ["Emitida", "Paga"] } }, select: { value: true, valueDecimal: true } },
    },
    orderBy: { date: "desc" },
  });

  const bankAccounts = await prisma.bankAccount.findMany({
    where: {
      isActive: true,
      ...(isSystemAdministrator(context.user)
        ? {}
        : { budgetUnitId: { in: context.user.allowedBudgetUnitIds } }),
    },
  });

  const suppliers = await prisma.supplier.findMany({
    include: {
      person: true,
      company: true
    },
    where: {
      status: "Ativo"
    }
  })

  const displayPayments = payments.map(({ valueDecimal, netValueDecimal, retentions, commitment, bankAccount, ...payment }) => {
    const { valueDecimal: commitmentValueDecimal, ...displayCommitment } = commitment
    const { currentBalanceDecimal, ...displayBankAccount } = bankAccount

    return {
      ...payment,
      value: Number(valueDecimal ?? payment.value),
      netValue: Number(netValueDecimal ?? valueDecimal ?? payment.value),
      retentionValue: retentions.reduce((total, retention) => total + Number(retention.valueDecimal), 0),
      commitment: {
        ...displayCommitment,
        value: Number(commitmentValueDecimal ?? displayCommitment.value),
      },
      bankAccount: {
        ...displayBankAccount,
        currentBalance: Number(currentBalanceDecimal ?? displayBankAccount.currentBalance),
      },
    }
  })

  const displayCommitments = commitments.map(({ valueDecimal, movements, ...commitment }) => ({
    ...commitment,
    value: movements.reduce((total, movement) => total + (movement.type === "Reforço" ? Number(movement.valueDecimal) : -Number(movement.valueDecimal)), Number(valueDecimal ?? commitment.value)),
  }))

  const displaySettlements = settlements.map(({ valueDecimal, payments, ...settlement }) => {
    const value = Number(valueDecimal ?? settlement.value);
    const paidValue = payments.reduce((total, payment) => total + Number(payment.valueDecimal ?? payment.value), 0);
    return { ...settlement, value, paidValue, availableToPay: value - paidValue };
  });

  const displayBankAccounts = bankAccounts.map(({ currentBalanceDecimal, ...account }) => ({
    ...account,
    currentBalance: Number(currentBalanceDecimal ?? account.currentBalance),
  }))

  const pendingWithholdings = await prisma.withholdingPayable.findMany({
    where: {
      status: "Pendente",
      retention: { payment: { status: "Paga", commitment: { appropriation: appropriationFilter } } },
    },
    include: {
      retention: {
        include: {
          payment: { select: { orderNumber: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const receiptDocuments = await prisma.document.findMany({
    where: { status: "Válido", documentType: { not: "Modelo" } },
    select: { id: true, title: true, documentType: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const displayPendingWithholdings = pendingWithholdings.map((pw) => ({
    id: pw.id,
    type: pw.retention.type,
    description: pw.retention.description,
    value: Number(pw.valueDecimal),
    orderNumber: pw.retention.payment.orderNumber,
    dueDate: pw.dueDate ? pw.dueDate.toISOString().substring(0, 10) : null,
  }));

  return (
    <PagamentosClient
      payments={displayPayments}
      commitments={displayCommitments}
      settlements={displaySettlements}
      bankAccounts={displayBankAccounts}
      suppliers={suppliers}
      pendingWithholdings={displayPendingWithholdings}
      receiptDocuments={receiptDocuments}
    />
  );
}
