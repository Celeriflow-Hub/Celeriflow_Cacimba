import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { Wrench } from "lucide-react";
import { ServicosClient } from "../components/ServicosClient";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function ServicosPage() {
  const { prisma } = await getTenantContextForModule("SANEAMENTO");
  const [orders, units] = await Promise.all([
    prisma.sanServiceOrder.findMany({
      include: { unit: { select: { code: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sanConsumerUnit.findMany({
      select: { id: true, code: true, address: true },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Serviços e Manutenção" icon={<Wrench className="size-4 shrink-0 text-[#0284C7]" />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <p className="px-1 text-xs text-gray-500 dark:text-gray-400">{orders.length} ordem{orders.length !== 1 ? "s" : ""} de serviço</p>
      <div className="min-h-0 flex-1"><ServicosClient orders={orders} units={units} /></div>
    </PageFrame>
  );
}
