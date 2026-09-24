import { getTenantContextForModule, isSystemAdministrator } from "@/lib/platform/tenant-context";
import RestosAPagarClient from "./RestosAPagarClient";

export const dynamic = "force-dynamic";

export default async function RestosAPagarPage() {
  const context = await getTenantContextForModule("FINANCEIRO");
  const appropriationFilter = isSystemAdministrator(context.user)
    ? {}
    : { budgetUnitId: { in: context.user.allowedBudgetUnitIds } };
  const [payables, years, payments] = await Promise.all([
    context.prisma.payableCarryForward.findMany({
      where: { commitment: { appropriation: appropriationFilter } },
      include: {
        financialYear: { select: { id: true, year: true, status: true } },
        originFinancialYear: { select: { id: true, year: true } },
        commitment: { select: { id: true, number: true, history: true, supplier: { select: { company: { select: { corporateName: true } }, person: { select: { fullName: true } } } } } },
        previousPayableCarryForward: { select: { id: true, financialYear: { select: { year: true } } } },
        successorPayableCarryForward: { select: { id: true, financialYear: { select: { year: true } } } },
        events: { include: { actorUsuario: { select: { nome: true } }, payment: { select: { orderNumber: true } } }, orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ originFinancialYear: { year: "desc" } }, { createdAt: "desc" }],
      take: 300,
    }),
    context.prisma.financialYear.findMany({ orderBy: { year: "desc" }, select: { id: true, year: true, status: true } }),
    context.prisma.payment.findMany({
      where: { status: "Paga", commitment: { appropriation: appropriationFilter } },
      select: { id: true, orderNumber: true, commitmentId: true, valueDecimal: true, value: true, date: true },
      orderBy: { date: "desc" },
      take: 300,
    }),
  ]);

  return <RestosAPagarClient
    years={years}
    payables={payables.map((payable) => ({
      id: payable.id,
      financialYear: payable.financialYear,
      originFinancialYear: payable.originFinancialYear,
      commitment: {
        ...payable.commitment,
        supplierName: payable.commitment.supplier.company?.corporateName ?? payable.commitment.supplier.person?.fullName ?? "Fornecedor não identificado",
      },
      previousYear: payable.previousPayableCarryForward?.financialYear.year,
      successorYear: payable.successorPayableCarryForward?.financialYear.year,
      value: payable.valueDecimal.toString(),
      type: payable.type,
      status: payable.status,
      events: payable.events.map((event) => ({ id: event.id, action: event.action, justification: event.justification, value: event.valueDecimal?.toString(), paymentOrderNumber: event.payment?.orderNumber, actor: event.actorUsuario.nome, createdAt: event.createdAt.toISOString() })),
    }))}
    payments={payments.map((payment) => ({ id: payment.id, orderNumber: payment.orderNumber, commitmentId: payment.commitmentId, value: (payment.valueDecimal ?? payment.value).toString(), date: payment.date.toISOString() }))}
  />;
}
