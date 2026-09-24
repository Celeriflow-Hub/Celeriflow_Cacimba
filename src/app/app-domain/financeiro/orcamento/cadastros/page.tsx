import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import CadastrosClient from "./CadastrosClient";

export const dynamic = "force-dynamic";

export default async function CadastrosFinanceirosPage() {
  const { prisma } = await getTenantContextForModule("FINANCEIRO");
  const [secretariats, budgetUnits, resourceSources, revenueNatures, expenseNatures] = await Promise.all([
    prisma.secretariat.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.budgetUnit.findMany({ include: { secretariat: { select: { name: true } } }, orderBy: { code: "asc" } }),
    prisma.resourceSource.findMany({ orderBy: { code: "asc" } }),
    prisma.revenueNature.findMany({ orderBy: { code: "asc" } }),
    prisma.expenseNature.findMany({ orderBy: { code: "asc" } }),
  ]);

  return <CadastrosClient secretariats={secretariats} budgetUnits={budgetUnits} resourceSources={resourceSources} revenueNatures={revenueNatures} expenseNatures={expenseNatures} />;
}
