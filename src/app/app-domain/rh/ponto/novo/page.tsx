import { PontoForm } from "../PontoForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";

export default async function NovoPontoPage() {
  const { prisma } = await getTenantContextForModule("RH");
  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
  
  return (
    <PontoForm employees={employees} />
  );
}
