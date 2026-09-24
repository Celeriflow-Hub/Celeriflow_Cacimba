import { getTenantContextForModule, isSystemAdministrator } from "@/lib/platform/tenant-context";
import ReceitasClient from "./ReceitasClient";

export default async function ReceitasPage() {
  const context = await getTenantContextForModule("FINANCEIRO");
  const accountAccess = isSystemAdministrator(context.user) ? {} : { budgetUnitId: { in: context.user.allowedBudgetUnitIds } };
  const [revenues, revenueNatures, resourceSources, bankAccounts] = await Promise.all([
    context.prisma.revenue.findMany({
      include: {
        revenueNature: { select: { code: true, name: true } },
        resourceSource: { select: { code: true, name: true } },
        reversal: { select: { id: true } },
        resourceRedistributions: { select: { valueDecimal: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 100,
    }),
    context.prisma.revenueNature.findMany({ orderBy: { code: "asc" } }),
    context.prisma.resourceSource.findMany({ orderBy: { code: "asc" } }),
    context.prisma.bankAccount.findMany({ where: accountAccess, select: { id: true, bankName: true, agency: true, accountNumber: true, resourceSourceId: true, isActive: true }, orderBy: { bankName: "asc" } }),
  ]);

  return <ReceitasClient
    revenues={revenues.map((revenue) => ({
      id: revenue.id,
      date: revenue.date.toISOString(),
      value: Number(revenue.valueDecimal ?? revenue.value),
      stage: revenue.stage,
      classification: revenue.classification,
      history: revenue.history,
      revenueNature: revenue.revenueNature,
      resourceSource: revenue.resourceSource,
      resourceSourceId: revenue.resourceSourceId,
      redistributedValue: revenue.resourceRedistributions.reduce((total, item) => total + Number(item.valueDecimal), 0),
      hasReversal: Boolean(revenue.reversal),
    }))}
    revenueNatures={revenueNatures}
    resourceSources={resourceSources}
    bankAccounts={bankAccounts}
  />;
}
