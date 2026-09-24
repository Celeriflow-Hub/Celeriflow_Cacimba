import { LicencaForm } from "../LicencaForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";

export default async function NovaLicencaPage() {
  const { prisma } = await getTenantContextForModule("RH");
  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });
  
  return (
    <LicencaForm employees={employees} />
  );
}
