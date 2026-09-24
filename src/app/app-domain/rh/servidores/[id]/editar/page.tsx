import { ServidorForm } from "../../ServidorForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { notFound } from "next/navigation";

export default async function EditarServidorPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      dependents: true,
      benefits: {
        include: { benefitConfig: true }
      }
    }
  });

  if (!employee) {
    notFound();
  }

  const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
  const secretariats = await prisma.secretariat.findMany({ orderBy: { name: 'asc' } });
  const benefitConfigs = await prisma.benefitConfig.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });

  return (
    <ServidorForm 
      data={employee} 
      roles={roles} 
      departments={departments} 
      secretariats={secretariats} 
      benefitConfigs={benefitConfigs}
    />
  );
}
