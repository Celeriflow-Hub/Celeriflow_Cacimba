import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { Stethoscope } from 'lucide-react';
import ProfissionaisClient from './ProfissionaisClient';
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function Page() {
  const { prisma } = await getTenantContextForModule("SAUDE");
  const items = await prisma.healthProfessional.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      employeeId: true,
      specialty: true,
      councilName: true,
      councilNumber: true,
      isActive: true,
      employee: { select: { id: true, name: true, cpf: true, registration: true } },
    },
  });

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    select: { id: true, name: true, cpf: true, registration: true },
    orderBy: { name: 'asc' }
  });

  return (
    <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      <PageHeader title="Profissionais de Saúde" icon={<Stethoscope className="size-4 shrink-0 text-emerald-600" />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <ProfissionaisClient professionals={items} employees={employees} />
    </PageFrame>
  );
}
