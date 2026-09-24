import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import ProntuarioClient from "./ProntuarioClient";

export default async function ProntuarioSocialPage() {
  const { prisma } = await getTenantContextForModule("SOCIAL");
  const atendimentos = await prisma.socialAttendance.findMany({
    include: {
      family: true,
      person: true,
      professional: true,
      unit: true,
    },
    orderBy: {
      date: 'desc'
    }
  });

  const familias = await prisma.socialFamily.findMany({ orderBy: { familyCode: 'asc' } });
  const persons = await prisma.person.findMany({ orderBy: { fullName: 'asc' } });
  const professionals = await prisma.employee.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  const units = await prisma.socialUnit.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

  return <ProntuarioClient 
    atendimentosInicial={atendimentos} 
    familias={familias} 
    persons={persons} 
    professionals={professionals} 
    units={units} 
  />;
}
