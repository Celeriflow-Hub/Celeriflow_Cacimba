import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { Users } from 'lucide-react';
import PacientesClient from './PacientesClient';
import { PageFrame } from "@/components/app-ui/PageFrame";
import { PageHeader } from "@/components/app-ui/PageHeader";

export default async function Page() {
  const { prisma } = await getTenantContextForModule("SAUDE");
  const items = await prisma.patient.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      personId: true,
      cns: true,
      bloodType: true,
      bloodDonor: true,
      referenceUnitId: true,
      teamId: true,
      status: true,
      person: { select: { id: true, fullName: true, cpf: true, birthDate: true } },
    },
  });

  const people = await prisma.person.findMany({
    orderBy: { fullName: 'asc' },
    select: { id: true, fullName: true, cpf: true, birthDate: true },
  });

  const units = await prisma.healthUnit.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  const teams = await prisma.healthTeam.findMany({
    where: { isActive: true },
    select: { id: true, name: true, unitId: true },
    orderBy: { name: 'asc' }
  });

  return (
    <PageFrame className="flex h-full min-h-0 flex-1 flex-col gap-1 overflow-hidden">
      <PageHeader title="Pacientes" icon={<Users className="size-4 shrink-0 text-emerald-600" />} className="dark:border-gray-700 dark:bg-gray-800 dark:[&>h1]:text-white" />
      <PacientesClient patients={items} people={people} units={units} teams={teams} />
    </PageFrame>
  );
}
