import Link from "next/link";
import { ArrowLeft, SearchCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { ErpPageTitle } from "@/components/app-ui/erp/ErpPageTitle";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { calculatePriceComparison, isSubmittedPriceQuote } from "@/lib/compras/price-research";
import { PriceResearchDetailClient } from "./PriceResearchDetailClient";

function supplierName(supplier: { person: { fullName: string } | null; company: { tradeName: string | null; corporateName: string } | null }) {
  return supplier.person?.fullName || supplier.company?.tradeName || supplier.company?.corporateName || "Fornecedor cadastrado";
}

export default async function PriceResearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const { id } = await params;
  const [research, suppliers] = await Promise.all([
    prisma.priceResearch.findUnique({
      where: { id },
      include: {
        process: {
          include: {
            purchaseRequest: { select: { number: true } },
            items: {
              orderBy: { createdAt: "asc" },
              include: {
                catalogItem: { select: { name: true, unit: true } },
                material: { select: { name: true, unitOfMeasure: true } },
              },
            },
          },
        },
        quotes: {
          orderBy: { createdAt: "asc" },
          include: {
            supplier: {
              select: {
                id: true,
                person: { select: { fullName: true } },
                company: { select: { tradeName: true, corporateName: true } },
              },
            },
          },
        },
      },
    }),
    prisma.supplier.findMany({
      where: { status: "Ativo" },
      select: {
        id: true,
        person: { select: { fullName: true, email: true } },
        company: { select: { tradeName: true, corporateName: true, emailPrimary: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!research) notFound();

  const submittedQuotes = research.quotes.filter((quote) => isSubmittedPriceQuote(quote.status)).map((quote) => ({ id: quote.id, supplierId: quote.supplierId, value: quote.value }));
  const comparison = calculatePriceComparison(submittedQuotes);
  const supplierOptions = suppliers.flatMap((supplier) => {
    const hasEmail = Boolean(supplier.person?.email || supplier.company?.emailPrimary);
    return hasEmail ? [{ id: supplier.id, name: supplierName(supplier) }] : [];
  });

  return (
    <PageFrame className="flex h-[calc(100vh-4rem)] min-h-0 flex-col gap-2 overflow-hidden">
      <ErpPageTitle title="Pesquisa de Preços" icon={<SearchCheck className="size-4 shrink-0 text-emerald-700" />} action={<Link href="/compras/pesquisas-precos" className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="size-3.5" />Voltar</Link>} />
      <PriceResearchDetailClient
        research={{
          id: research.id,
          status: research.status,
          deadlineAt: research.date.toISOString(),
          process: {
            number: research.process.number,
            object: research.process.object,
            purchaseRequestNumber: research.process.purchaseRequest?.number ?? null,
            items: research.process.items.map((item) => ({
              id: item.id,
              name: item.catalogItem?.name || item.material?.name || item.customName || "Item sem descrição",
              unit: item.catalogItem?.unit || item.material?.unitOfMeasure || "UN",
              quantity: item.quantity,
            })),
          },
          comparison,
          invitations: research.quotes.map((quote) => ({
            id: quote.id,
            supplierId: quote.supplierId,
            supplierName: supplierName(quote.supplier),
            status: quote.status,
            value: quote.value,
            createdAt: quote.createdAt.toISOString(),
            presentedAt: isSubmittedPriceQuote(quote.status) ? quote.date.toISOString() : null,
          })),
        }}
        suppliers={supplierOptions}
      />
    </PageFrame>
  );
}
