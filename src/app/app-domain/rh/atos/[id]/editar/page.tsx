import { AtoForm } from "../../AtoForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { notFound } from "next/navigation";

export default async function EditarAtoPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const { id } = await params;
  const act = await prisma.personnelAct.findUnique({
    where: { id }
  });

  if (!act) {
    notFound();
  }

  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' } });

  return (
    <AtoForm data={act} employees={employees} />
  );
}
