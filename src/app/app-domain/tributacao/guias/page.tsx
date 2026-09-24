import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import GuiasClient from "./GuiasClient";

export const dynamic = "force-dynamic";

export default async function GuiasPage() {
  const { prisma } = await getTenantContextForModule("TRIBUTACAO");
  const guias = await prisma.taxGuide.findMany({
    include: {
      assessment: {
        include: {
          taxpayer: { include: { person: true, company: true } },
          tax: true
        }
      },
      payments: { where: { status: "Confirmado" }, select: { amountPaidDecimal: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const displayGuides = guias.map(({ totalValueDecimal, payments, ...guide }) => {
    const totalValue = Number(totalValueDecimal ?? guide.totalValue);
    const paidValue = payments.reduce((total, payment) => total + Number(payment.amountPaidDecimal ?? 0), 0);
    return {
      ...guide,
      totalValue,
      outstandingValue: totalValue - paidValue,
    };
  });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <GuiasClient guias={displayGuides} />
    </div>
  );
}
