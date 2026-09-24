import { LicencaForm } from "../../LicencaForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { notFound } from "next/navigation";

export default async function EditarLicencaPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const { id } = await params;
  const leave = await prisma.leave.findUnique({
    where: { id }
  });

  if (!leave) {
    notFound();
  }

  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });

  return (
    <LicencaForm data={leave} employees={employees} />
  );
}
