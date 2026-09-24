import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import DemandasClient from "./DemandasClient";
import { ClipboardList } from "lucide-react";
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function DemandasPage() {
  const { prisma } = await getTenantContextForModule("ADMINISTRACAO");
  const demands = await prisma.internalDemand.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      secretariat: true,
      department: true,
      creator: true,
      assignee: true
    }
  });

  const secretariats = await prisma.secretariat.findMany({ where: { isActive: true }, select: { id: true, name: true } });
  const departments = await prisma.department.findMany({ where: { isActive: true }, select: { id: true, name: true } });
  const employees = await prisma.employee.findMany({ where: { isActive: true }, select: { id: true, name: true } });

  return (
    <PageFrame className="flex h-full min-h-0 flex-col">
      <PageHeader title="Demandas Internas" icon={<ClipboardList className="size-4 shrink-0 text-blue-600" />} action={<button type="button" className="inline-flex h-7 items-center rounded bg-blue-700 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-800">Adicionar demanda</button>} />
      <DemandasClient 
        demands={demands} 
        secretariats={secretariats}
        departments={departments}
        employees={employees}
      />
    </PageFrame>
  );
}
