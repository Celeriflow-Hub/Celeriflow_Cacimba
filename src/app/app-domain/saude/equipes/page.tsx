import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { Users } from 'lucide-react';
import EquipesClient from './EquipesClient';
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function Page() {
  const { prisma } = await getTenantContextForModule("SAUDE");
  const items = await prisma.healthTeam.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      code: true,
      microarea: true,
      unitId: true,
      isActive: true,
      unit: { select: { id: true, name: true } },
    },
  });

  const units = await prisma.healthUnit.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return (
    <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      <PageHeader title="Equipes ESF" icon={<Users className="size-4 shrink-0 text-emerald-600" />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <EquipesClient teams={items} units={units} />
    </PageFrame>
  );
}
