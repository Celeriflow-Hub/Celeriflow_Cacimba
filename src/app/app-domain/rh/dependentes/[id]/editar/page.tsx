import { DependenteForm } from "../../DependenteForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { notFound } from "next/navigation";

export default async function EditarDependentePage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const { id } = await params;
  const dependent = await prisma.dependent.findUnique({
    where: { id }
  });

  if (!dependent) {
    notFound();
  }

  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });

  return (
    <DependenteForm data={dependent} employees={employees} />
  );
}
