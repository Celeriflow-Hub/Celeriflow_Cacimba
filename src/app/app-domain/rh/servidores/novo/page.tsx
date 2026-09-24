import { ServidorForm } from "../ServidorForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";

export default async function NovoServidorPage() {
  const { prisma } = await getTenantContextForModule("RH");
  const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
  const secretariats = await prisma.secretariat.findMany({ orderBy: { name: 'asc' } });
  const benefitConfigs = await prisma.benefitConfig.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

  return (
    <ServidorForm 
      roles={roles} 
      departments={departments} 
      secretariats={secretariats} 
      benefitConfigs={benefitConfigs}
    />
  );
}
