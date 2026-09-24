import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import UnidadesClient from "./UnidadesClient";

export default async function UnidadesSociaisPage() {
  const { prisma } = await getTenantContextForModule("SOCIAL");
  const unidades = await prisma.socialUnit.findMany({
    include: {
      realEstate: true,
      manager: true
    },
    orderBy: { name: 'asc' }
  });

  const realEstates = await prisma.realEstate.findMany({
    orderBy: { streetName: 'asc' }
  });

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });

  return (
    <UnidadesClient 
      unidadesInicial={unidades} 
      realEstates={realEstates} 
      employees={employees} 
    />
  );
}
