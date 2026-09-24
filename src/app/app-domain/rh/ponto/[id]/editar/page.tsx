import { PontoForm } from "../../PontoForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { notFound } from "next/navigation";

export default async function EditarPontoPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const { id } = await params;
  const record = await prisma.attendanceRecord.findUnique({
    where: { id }
  });

  if (!record) {
    notFound();
  }

  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });

  return (
    <PontoForm data={record} employees={employees} />
  );
}
