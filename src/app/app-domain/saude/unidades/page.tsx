import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { Building2 } from 'lucide-react';
import UnidadesClient from './UnidadesClient';
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function Page() {
  const { prisma } = await getTenantContextForModule("SAUDE");
  const items = await prisma.healthUnit.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, type: true, cnes: true, phone: true, isActive: true },
  });

  return (
    <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      <PageHeader title="Unidades de Saúde" icon={<Building2 className="size-4 shrink-0 text-emerald-600" />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <UnidadesClient units={items} />
    </PageFrame>
  );
}
