import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { priceQuoteStatuses } from "@/lib/compras/price-research";
import { PriceResearchListClient } from "./PriceResearchListClient";

export default async function PriceResearchPage() {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const researches = await prisma.priceResearch.findMany({
    include: {
      process: { select: { number: true, object: true, purchaseRequest: { select: { number: true } } } },
      _count: { select: { quotes: { where: { status: { in: [priceQuoteStatuses.submitted, priceQuoteStatuses.legacyActive] } } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <PriceResearchListClient researches={researches.map((research) => ({
    id: research.id,
    status: research.status,
    deadlineAt: research.date.toISOString(),
    estimatedValue: research.estimatedValue,
    process: {
      number: research.process.number,
      object: research.process.object,
      purchaseRequestNumber: research.process.purchaseRequest?.number ?? null,
    },
    submittedQuoteCount: research._count.quotes,
  }))} />;
}
