import { getTenantContextForModule, isSystemAdministrator } from "@/lib/platform/tenant-context";
import LiquidacoesClient from "./LiquidacoesClient"

export default async function LiquidacoesPage() {
  const context = await getTenantContextForModule("FINANCEIRO");
  const { prisma } = context;
  const appropriationFilter = isSystemAdministrator(context.user)
    ? {}
    : { budgetUnitId: { in: context.user.allowedBudgetUnitIds } };
  const settlements = await prisma.settlement.findMany({
    where: { commitment: { appropriation: appropriationFilter } },
    include: {
      commitment: {
        include: {
          supplier: {
            include: {
              person: true,
              company: true
            }
          },
          purchaseReceipt: { select: { number: true } },
        },
      },
      author: true,
      document: { select: { id: true, title: true } },
      financialDocument: { select: { id: true, number: true, title: true } },
      payments: { where: { status: { in: ["Emitida", "Paga"] } }, select: { valueDecimal: true, value: true } },
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
    include: {
      supplier: {
        include: {
          person: true,
          company: true
        }
      },
      movements: { select: { type: true, valueDecimal: true } },
      settlements: { where: { status: "Liquidado" }, select: { valueDecimal: true, value: true } },
      purchaseReceipt: { select: { number: true } },
    }
  })

  const employees = await prisma.employee.findMany({
    where: {
      isActive: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  const documents = await prisma.document.findMany({
    where: { status: "Válido", documentType: { not: "Modelo" } },
    select: { id: true, title: true, documentType: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const retentionRules = await prisma.retentionRule.findMany({
    where: { isActive: true },
    select: { id: true, code: true, type: true, description: true, calculationBasePercentage: true, ratePercentage: true, serviceCode: true },
    orderBy: { code: "asc" },
  });

  const displaySettlements = settlements.map(({ valueDecimal, payments, ...settlement }) => ({
    ...settlement,
    value: Number(valueDecimal ?? settlement.value),
    paidValue: payments.reduce((total, payment) => total + Number(payment.valueDecimal ?? payment.value), 0),
  }))

  const displayCommitments = commitments.map(({ valueDecimal, movements, settlements, ...commitment }) => {
    const originalValue = Number(valueDecimal ?? commitment.value);
    const value = movements.reduce((total, movement) => total + (movement.type === "Reforço" ? Number(movement.valueDecimal) : -Number(movement.valueDecimal)), originalValue);
    const settledValue = settlements.reduce((total, settlement) => total + Number(settlement.valueDecimal ?? settlement.value), 0);
    return { ...commitment, value, settledValue, availableToSettle: value - settledValue };
  })

  return <LiquidacoesClient settlements={displaySettlements} commitments={displayCommitments} employees={employees} documents={documents} retentionRules={retentionRules.map((rule) => ({ ...rule, calculationBasePercentage: Number(rule.calculationBasePercentage), ratePercentage: Number(rule.ratePercentage) }))} />
}
