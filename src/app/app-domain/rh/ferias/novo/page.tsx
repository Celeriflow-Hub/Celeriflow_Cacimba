import { FeriasForm } from "../FeriasForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";

export default async function NovaFeriasPage() {
  const { prisma } = await getTenantContextForModule("RH");
  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
  
  return (
    <FeriasForm employees={employees} />
  );
}
