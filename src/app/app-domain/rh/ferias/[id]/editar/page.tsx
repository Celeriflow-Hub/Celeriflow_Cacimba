import { FeriasForm } from "../../FeriasForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { notFound } from "next/navigation";

export default async function EditarFeriasPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const { id } = await params;
  const vacation = await prisma.vacation.findUnique({
    where: { id }
  });

  if (!vacation) {
    notFound();
  }

  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });

  return (
    <FeriasForm data={vacation} employees={employees} />
  );
}
