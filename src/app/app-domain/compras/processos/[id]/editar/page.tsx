import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { ProcessoForm } from "../../ProcessoForm";
import { notFound } from "next/navigation";

export default async function EditarProcessoPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("COMPRAS");
  const resolvedParams = await params;
  const processoPromise = prisma.purchaseProcess.findUnique({
    where: { id: resolvedParams.id },
    include: { items: { include: { requestItemOrigins: { select: { id: true } } } } }
  });
  
  const catalogItemsPromise = prisma.catalogItem.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });

  const [processo, catalogItems] = await Promise.all([processoPromise, catalogItemsPromise]);

  if (!processo) {
    notFound();
  }

  const mappedProcesso = {
    ...processo,
    items: processo.items.map((item) => ({
      id: item.id,
      catalogItemId: item.catalogItemId ?? (item.customName ? "custom" : ""),
      customName: item.customName ?? "",
      quantity: item.quantity,
      estimatedUnitValue: item.estimatedUnitValue ?? 0,
      sourceLocked: item.requestItemOrigins.length > 0,
    }))
  };

  return <ProcessoForm data={mappedProcesso} catalogItems={catalogItems} />;
}
