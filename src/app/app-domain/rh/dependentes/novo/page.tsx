import { DependenteForm } from "../DependenteForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";

export default async function NovoDependentePage({ searchParams }: { searchParams: Promise<{ employeeId?: string }> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const { employeeId } = await searchParams;
  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
  
  return (
    <DependenteForm employees={employees} defaultEmployeeId={employeeId} />
  );
}
