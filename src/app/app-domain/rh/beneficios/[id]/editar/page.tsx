import { BeneficioForm } from "../../BeneficioForm";
import { getTenantContextForModule } from "@/lib/platform/tenant-context";
import { notFound } from "next/navigation";

export default async function EditarBeneficioPage({ params }: { params: Promise<{ id: string }> }) {
  const { prisma } = await getTenantContextForModule("RH");
  const { id } = await params;
  const benefit = await prisma.benefitConfig.findUnique({
    where: { id }
  });

  if (!benefit) {
    notFound();
  }

  const suppliers = await prisma.supplier.findMany({ 
    include: { company: true, person: true },
    orderBy: { company: { corporateName: 'asc' } } 
  });

  return (
    <BeneficioForm data={benefit} suppliers={suppliers} />
  );
}
