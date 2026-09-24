import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { Receipt } from "lucide-react";
import { FaturasClient } from "../components/FaturasClient";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function FaturasPage() {
  const { prisma } = await getTenantContextForModule("SANEAMENTO");
  const invoices = await prisma.sanInvoice.findMany({
    select: {
      id: true,
      invoiceNumber: true,
      competence: true,
      totalAmount: true,
      dueDate: true,
      status: true,
      unit: { select: { code: true } },
    },
    orderBy: { dueDate: "desc" },
  });

  const serialized = invoices.map((inv) => ({
    ...inv,
    dueDate: inv.dueDate.toISOString(),
  }));

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Contas de Água e Esgoto" icon={<Receipt className="size-4 shrink-0 text-[#0284C7]" />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <p className="px-1 text-xs text-gray-500 dark:text-gray-400">{invoices.length} fatura{invoices.length !== 1 ? "s" : ""}</p>
      <div className="min-h-0 flex-1"><FaturasClient invoices={serialized} /></div>
    </PageFrame>
  );
}
