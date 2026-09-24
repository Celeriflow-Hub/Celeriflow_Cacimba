import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { Droplets } from "lucide-react";
import { UnidadesClient } from "../components/UnidadesClient";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function UnidadesPage() {
  const { prisma } = await getTenantContextForModule("SANEAMENTO");
  const units = await prisma.sanConsumerUnit.findMany({
    select: {
      id: true,
      code: true,
      address: true,
      category: true,
      status: true,
      ownerName: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageFrame className="flex h-full min-h-0 flex-col gap-2 overflow-hidden px-1 py-1 md:px-2">
      <PageHeader title="Unidades Consumidoras" icon={<Droplets className="size-4 shrink-0 text-[#0284C7]" />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <p className="px-1 text-xs text-gray-500 dark:text-gray-400">{units.length} unidade{units.length !== 1 ? "s" : ""} cadastrada{units.length !== 1 ? "s" : ""}</p>
      <div className="min-h-0 flex-1"><UnidadesClient units={units} /></div>
    </PageFrame>
  );
}
