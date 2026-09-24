import { AtoForm } from "../AtoForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";

export default async function NovoAtoPage() {
  const { prisma } = await getTenantContextForModule("RH");
  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
  
  return (
    <AtoForm employees={employees} />
  );
}
